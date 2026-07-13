import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureUserRecord, getRequestUser } from "@/lib/auth";
import { ingestUrlSchema } from "@/lib/ai/schemas";
import { consumeCredits, creditErrorResponse, requireCredits } from "@/lib/credits";
import { assertCanCreateProject, planLimitErrorResponse } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma/client";
import { saveStoredProject } from "@/lib/projects/store";
import { assertIngestRateLimit } from "@/lib/rate-limit";
import { extractYouTubeSource, normalizeYouTubeUrl } from "@/lib/v1/youtube-source";
import type { Project, SourceSummary } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    await assertIngestRateLimit(user.id);
    await requireCredits(user);

    const payload = ingestUrlSchema.parse(await request.json());
    const sourceUrl = normalizeYouTubeUrl(payload.url);

    await assertCanCreateProject(user, "YOUTUBE");
    await ensureUserRecord(user);

    const source = await extractYouTubeSource(sourceUrl);
    const project = buildProject({
      userId: user.id,
      sourceUrl,
      source,
    });

    saveStoredProject(project);
    await persistProject(project);
    await consumeCredits(user);

    return NextResponse.json({
      projectId: project.id,
      title: project.title,
      duration: project.duration ?? 0,
      wordCount: project.wordCount ?? 0,
      warning: source.warning,
      transcriptStatus: source.transcriptStatus,
      project,
    });
  } catch (error) {
    if (error instanceof Response) return error;

    const planResponse = planLimitErrorResponse(error);
    if (planResponse) return planResponse;

    const creditResponse = creditErrorResponse(error);
    if (creditResponse) return creditResponse;

    console.error("[v1:ingest:url] failed:", error);
    const message = error instanceof Error ? error.message : "We could not analyze that YouTube URL.";

    return NextResponse.json(
      {
        error: message,
        code: "ingest_failed",
        reason: message,
      },
      { status: 400 },
    );
  }
}

function buildProject({
  userId,
  sourceUrl,
  source,
}: {
  userId: string;
  sourceUrl: string;
  source: Awaited<ReturnType<typeof extractYouTubeSource>>;
}): Project {
  const now = new Date().toISOString();
  const projectId = `youtube-${hash(`${sourceUrl}:${userId}`).slice(0, 10)}-${userId}`;
  const transcriptWords = source.transcript.split(/\s+/).filter(Boolean).length;
  const sourceWords = source.sourceDocument.split(/\s+/).filter(Boolean).length;
  const summary = buildSummary(source);

  return {
    id: projectId,
    userId,
    title: source.title,
    sourceType: "YOUTUBE",
    sourceUrl,
    thumbnailUrl: source.thumbnailUrl,
    sourceText: source.sourceDocument,
    transcript: source.sourceDocument,
    duration: source.durationSeconds,
    wordCount: transcriptWords || sourceWords,
    summary,
    hooks: [],
    contents: [],
    outputs: [],
    createdAt: now,
    updatedAt: now,
    status: "DRAFT",
  };
}

function buildSummary(source: Awaited<ReturnType<typeof extractYouTubeSource>>): SourceSummary {
  const transcriptLine =
    source.transcriptStatus === "available"
      ? `Transcript found (${source.transcript.split(/\s+/).filter(Boolean).length} words).`
      : "Transcript unavailable. Generation will use metadata and description only.";

  return {
    tldr: `${transcriptLine} Source is ready for one-pass V1 generation.`,
    takeaways: [
      `Channel: ${source.channelName}`,
      `Published: ${source.publishedDate}`,
      source.description ? source.description.slice(0, 180) : "No description was available.",
    ],
    hooks: [],
    detectedTone: "educational",
    topics: source.tags.length > 0 ? source.tags.slice(0, 5) : ["youtube", "source repurposing"],
    targetAudience: "Creators and their audience",
  };
}

async function persistProject(project: Project) {
  await prisma.project.upsert({
    where: { id: project.id },
    update: {
      title: project.title,
      sourceUrl: project.sourceUrl,
      sourceText: project.sourceText,
      sourceType: "youtube",
      thumbnailUrl: project.thumbnailUrl,
      transcript: project.transcript,
      summary: project.summary as Prisma.InputJsonValue,
      duration: project.duration,
      wordCount: project.wordCount,
      hooks: { deleteMany: {} },
      contents: { deleteMany: {} },
    },
    create: {
      id: project.id,
      userId: project.userId ?? "local-user",
      title: project.title,
      sourceUrl: project.sourceUrl,
      sourceText: project.sourceText,
      sourceType: "youtube",
      thumbnailUrl: project.thumbnailUrl,
      transcript: project.transcript,
      summary: project.summary as Prisma.InputJsonValue,
      duration: project.duration,
      wordCount: project.wordCount,
    },
  });
}

function hash(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}
