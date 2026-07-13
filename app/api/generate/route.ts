import crypto from "node:crypto";
import { getRequestUser } from "@/lib/auth";
import { generatePostSchema } from "@/lib/ai/schemas";
import { assertGenerationRateLimit } from "@/lib/rate-limit";
import { trackServerEvent } from "@/lib/analytics";
import { consumeCredits, creditErrorResponse, requireCredits } from "@/lib/credits";
import {
  assertCanGenerateContent,
  planLimitErrorResponse,
  recordGeneratedContentUsage,
} from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma/client";
import { getStoredProject, saveStoredProject } from "@/lib/projects/store";
import { recordUsageEvent } from "@/lib/usage";
import { generateV1SocialOutputs } from "@/lib/v1/social-generator";
import { buildGenerationSource } from "@/lib/v1/generation-source";
import type { Platform, Project, SocialOutput, Tone } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const v1Platforms: Platform[] = [
  "LINKEDIN",
  "TWITTER",
  "INSTAGRAM",
  "THREADS",
  "FACEBOOK",
  "COMMUNITY",
  "CAROUSEL",
];

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    await assertGenerationRateLimit(user.id);
    await requireCredits(user);

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return Response.json({ error: "Project not found", code: "project_not_found" }, { status: 404 });
    }

    const platforms = parsePlatforms(url.searchParams.get("platforms"));
    const tone = (url.searchParams.get("tone") ?? "Professional") as Tone;
    const isRegeneration = url.searchParams.get("isRegeneration") === "true";
    const requestId = crypto.randomUUID();
    logGenerationStage(requestId, "api_request_received", {
      projectId,
      platforms,
      tone,
      isRegeneration,
      transport: "legacy-get",
    });
    await assertCanGenerateContent(user, platforms);

    const project = await loadProjectForGeneration(projectId, user.id);
    if (!project) {
      return Response.json({ error: "Project not found", code: "project_not_found" }, { status: 404 });
    }

    const source = buildGenerationSource(project);
    return streamGeneration({
      requestId,
      user,
      projectId,
      platforms,
      tone,
      isRegeneration,
      sourceDocument: source.sourceDocument,
      transcriptAvailable: source.transcriptAvailable,
      sourceMode: source.sourceMode,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GET /api/generate failed:", error);

    const planResponse = planLimitErrorResponse(error);
    if (planResponse) return planResponse;

    const creditResponse = creditErrorResponse(error);
    if (creditResponse) return creditResponse;

    const failure = describeGenerationFailure(error);
    return Response.json(failure, { status: failure.status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    await assertGenerationRateLimit(user.id);
    await requireCredits(user);

    const payload = generatePostSchema.parse(await request.json());
    const requestId = crypto.randomUUID();
    logGenerationStage(requestId, "api_request_received", {
      projectId: payload.projectId,
      platforms: payload.platforms,
      tone: payload.tone,
      isRegeneration: payload.isRegeneration,
    });
    await assertCanGenerateContent(user, payload.platforms);

    const project = await loadProjectForGeneration(payload.projectId, user.id);
    if (!project) {
      return Response.json({ error: "Project not found", code: "project_not_found" }, { status: 404 });
    }

    const source = buildGenerationSource(project);
    return streamGeneration({
      requestId,
      user,
      projectId: payload.projectId,
      platforms: parsePlatforms(payload.platforms.join(",")),
      tone: payload.tone,
      isRegeneration: payload.isRegeneration,
      sourceDocument: source.sourceDocument,
      transcriptAvailable: source.transcriptAvailable,
      sourceMode: source.sourceMode,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/generate failed:", error);

    const planResponse = planLimitErrorResponse(error);
    if (planResponse) return planResponse;

    const creditResponse = creditErrorResponse(error);
    if (creditResponse) return creditResponse;

    const failure = describeGenerationFailure(error);
    return Response.json(failure, { status: failure.status });
  }
}

function streamGeneration({
  requestId,
  user,
  projectId,
  platforms,
  tone,
  isRegeneration,
  sourceDocument,
  transcriptAvailable,
  sourceMode,
}: {
  requestId: string;
  user: Awaited<ReturnType<typeof getRequestUser>>;
  projectId: string;
  platforms: Platform[];
  tone: Tone | string;
  isRegeneration: boolean;
  sourceDocument: string;
  transcriptAvailable: boolean;
  sourceMode: "metadata" | "transcript";
}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      void (async () => {
        try {
          logGenerationStage(requestId, "generation_started", { projectId, sourceMode, platforms });
          send({ stage: "generation_started", requestId, sourceMode });

          const outputs = await generateV1SocialOutputs({
            projectId,
            sourceDocument,
            platforms,
            tone,
            transcriptAvailable,
            isRegeneration,
            previousDrafts: isRegeneration ? await loadPreviousDrafts(projectId, user.id, platforms) : [],
            onStage(stage, metadata) {
              logGenerationStage(requestId, stage, metadata);
              send({ stage, requestId, ...metadata });
            },
          });

          if (outputs.length === 0) {
            throw new Error("The AI provider returned no generated posts.");
          }

          await persistGeneratedOutputs({ userId: user.id, projectId, outputs, tone });
          logGenerationStage(requestId, "database_saved", { projectId, outputCount: outputs.length });
          send({ stage: "database_saved", requestId, outputCount: outputs.length });

          await recordGeneratedContentUsage({
            userId: user.id,
            count: outputs.length,
            metadata: { projectId, platforms, tone },
          });
          await recordUsageEvent({
            userId: user.id,
            eventType: "content_generated",
            metadata: { projectId, platforms, tone },
          });
          await trackServerEvent("content_generated", {
            userId: user.id,
            projectId,
            metadata: { platforms: platforms.join(","), tone, architecture: "v1-one-pass", sourceMode },
          });
          await consumeCredits(user);

          for (const output of outputs) {
            send({ stage: "output", requestId, output });
          }
          logGenerationStage(requestId, "response_returned", { outputCount: outputs.length });
          send({ stage: "response_returned", requestId, done: true, outputCount: outputs.length });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Content generation failed.";
          const failure = describeGenerationFailure(error);
          console.error(`[generation:${requestId}] failed`, error);
          send({
            stage: "failed",
            requestId,
            error: failure.error,
            code: failure.code,
            detail: process.env.NODE_ENV === "production" ? undefined : message,
          });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function logGenerationStage(requestId: string, stage: string, metadata?: Record<string, unknown>) {
  console.info(`[generation:${requestId}] ${stage}`, metadata ?? {});
}

function parsePlatforms(value: string | null): Platform[] {
  if (!value) return v1Platforms;
  const selected = value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is Platform => v1Platforms.includes(item as Platform));
  return selected.length ? selected : v1Platforms;
}

async function loadProjectForGeneration(projectId: string, userId: string): Promise<Project | null> {
  const dbProject = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      userId: true,
      title: true,
      sourceUrl: true,
      sourceText: true,
      sourceType: true,
      thumbnailUrl: true,
      transcript: true,
      summary: true,
      duration: true,
      wordCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (dbProject) {
    // Normalize sourceType: DB stores lowercase ("youtube") but app-layer uses uppercase ("YOUTUBE")
    const rawSourceType = String(dbProject.sourceType ?? "TEXT").toUpperCase();
    const sourceType = (["YOUTUBE", "PODCAST", "BLOG", "TEXT"].includes(rawSourceType)
      ? rawSourceType
      : "TEXT") as Project["sourceType"];

    return {
      id: dbProject.id,
      userId: dbProject.userId,
      title: dbProject.title,
      sourceType,
      sourceUrl: dbProject.sourceUrl ?? undefined,
      thumbnailUrl: dbProject.thumbnailUrl ?? undefined,
      sourceText: dbProject.sourceText ?? undefined,
      transcript: dbProject.transcript ?? "",
      duration: dbProject.duration ?? undefined,
      wordCount: dbProject.wordCount ?? undefined,
      summary: (dbProject.summary as Project["summary"]) ?? {
        tldr: "Source ready for V1 generation.",
        takeaways: [],
        hooks: [],
        detectedTone: "educational",
        topics: [],
        targetAudience: "Creators",
      },
      hooks: [],
      contents: [],
      outputs: [],
      createdAt: dbProject.createdAt.toISOString(),
      updatedAt: dbProject.updatedAt.toISOString(),
      status: "DRAFT",
    };
  }

  return getStoredProject(projectId) ?? null;
}

async function loadPreviousDrafts(projectId: string, userId: string, platforms: Platform[]) {
  try {
    const rows = await prisma.content.findMany({
      where: {
        projectId,
        platform: { in: platforms },
        project: { userId },
      },
      select: { body: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return rows.map((row) => row.body).filter(Boolean);
  } catch {
    const stored = getStoredProject(projectId);
    return (stored?.contents ?? [])
      .filter((content) => platforms.includes(content.platform))
      .map((content) => content.body)
      .filter(Boolean);
  }
}

async function persistGeneratedOutputs({
  userId,
  projectId,
  outputs,
  tone,
}: {
  userId: string;
  projectId: string;
  outputs: SocialOutput[];
  tone: Tone | string;
}) {
  if (outputs.length === 0) return;

  try {
    const storedProject = getStoredProject(projectId);
    if (storedProject) {
      const contents = outputs.map((output, index) => ({
        id: output.id,
        projectId,
        platform: output.platform,
        contentType: output.outputType,
        body: stringifyGeneratedContent(output.content),
        originalBody: stringifyGeneratedContent(output.originalContent ?? output.content),
        tone: String(output.tone ?? tone),
        approved: output.approved,
        order: index,
        createdAt: output.createdAt,
      }));
      const outputPlatforms = new Set(outputs.map((output) => output.platform));
      const retainedContents = (storedProject.contents ?? []).filter(
        (content) => !outputPlatforms.has(content.platform),
      );
      const retainedOutputs = (storedProject.outputs ?? []).filter(
        (output) => !outputPlatforms.has(output.platform),
      );
      saveStoredProject({
        ...storedProject,
        contents: [...contents, ...retainedContents],
        outputs: [...outputs, ...retainedOutputs],
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Local cache save failed:", error);
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) {
    if (getStoredProject(projectId)) return;
    throw new Error("Project disappeared before generated posts could be saved.");
  }
    const outputPlatforms = Array.from(new Set(outputs.map((output) => output.platform)));

  await prisma.$transaction([
    prisma.content.deleteMany({ where: { projectId, platform: { in: outputPlatforms } } }),
    ...outputs.map((output, index) => {
      const body = stringifyGeneratedContent(output.content);
      const originalBody = stringifyGeneratedContent(output.originalContent ?? output.content);
      return prisma.content.create({
        data: {
          id: output.id,
          projectId,
          platform: output.platform,
          contentType: output.outputType,
          body,
          originalBody,
          tone: String(output.tone ?? tone),
          approved: output.approved,
          order: index,
        },
      });
    }),
  ]);
}

function stringifyGeneratedContent(value: unknown) {
  if (typeof value === "string") return value;
  if (!value) return "";
  return JSON.stringify(value, null, 2);
}

function describeGenerationFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("abort")) {
    return { error: "The AI request timed out. Retry in a moment.", code: "provider_timeout", status: 504 };
  }
  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("429")) {
    return { error: "The AI provider quota is temporarily exhausted. Retry later.", code: "provider_quota", status: 429 };
  }
  if (lower.includes("api key") || lower.includes("unauthorized") || lower.includes("authentication")) {
    return { error: "The AI provider credentials are invalid. Contact support.", code: "provider_auth", status: 503 };
  }
  if (lower.includes("prisma") || lower.includes("database") || lower.includes("connection pool")) {
    return { error: "The database is temporarily unavailable. Your source is safe; retry generation.", code: "database_unavailable", status: 503 };
  }
  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("econn")) {
    return { error: "The AI provider could not be reached. Check your connection and retry.", code: "provider_network", status: 503 };
  }
  return { error: "Content generation failed. Retry the request.", code: "generation_failed", status: 500 };
}
