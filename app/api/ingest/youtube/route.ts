import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { ingestYoutube } from "@/lib/ingest";
import { ingestYoutubeSchema } from "@/lib/ai/schemas";
import { trackServerEvent } from "@/lib/analytics";
import { consumeCredits, creditErrorResponse, requireCredits } from "@/lib/credits";
import { assertCanCreateProject, planLimitErrorResponse } from "@/lib/plan-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    await requireCredits(user);
    const payload = ingestYoutubeSchema.parse(await request.json());
    await assertCanCreateProject(user, "YOUTUBE");
    const project = await ingestYoutube(payload.url);
    await trackServerEvent("source_ingested", {
      userId: user.id,
      projectId: project.id,
      metadata: { sourceType: "YOUTUBE" },
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
    if (error instanceof Response) return error;
    const planResponse = planLimitErrorResponse(error);
    if (planResponse) return planResponse;
    const creditResponse = creditErrorResponse(error);
    if (creditResponse) return creditResponse;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "video_unavailable",
        code: "video_unavailable",
        fallback: "paste_text",
      },
      { status: 400 },
    );
  }
}
