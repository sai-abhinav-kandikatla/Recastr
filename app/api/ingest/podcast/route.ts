import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { ingestPodcast } from "@/lib/ingest";
import { trackServerEvent } from "@/lib/analytics";
import { consumeCredits, creditErrorResponse, requireCredits } from "@/lib/credits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    await requireCredits(user);
    const contentType = request.headers.get("content-type") ?? "";
    const fileName = contentType.includes("multipart/form-data")
      ? "podcast-upload.mp3"
      : ((await request.json().catch(() => ({}))) as { title?: string }).title ?? "podcast-upload.mp3";
    const project = await ingestPodcast(fileName);
    await trackServerEvent("source_ingested", {
      userId: user.id,
      projectId: project.id,
      metadata: { sourceType: "PODCAST" },
    });
    await consumeCredits(user);
    return NextResponse.json({
      projectId: project.id,
      title: project.title,
      thumbnailUrl: project.thumbnailUrl,
      transcript: project.transcript,
      summary: project.summary,
      project,
    });
  } catch (error) {
    const creditResponse = creditErrorResponse(error);
    if (creditResponse) return creditResponse;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "podcast_ingest_failed",
        code: "podcast_ingest_failed",
        fallback: "paste_text",
      },
      { status: 400 },
    );
  }
}
