import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { consumeCredits, creditErrorResponse, requireCredits } from "@/lib/credits";
import { rewriteContent } from "@/lib/ai/rewrite";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    await requireCredits(user);

    const { content, platform, mode, extractedFacts } = await request.json();

    if (!content || !platform || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: content, platform, or mode" },
        { status: 400 }
      );
    }

    const rewritten = await rewriteContent(content, platform, mode, extractedFacts);

    await consumeCredits(user);

    return NextResponse.json({ content: rewritten });
  } catch (error) {
    const creditResponse = creditErrorResponse(error);
    if (creditResponse) return creditResponse;
    
    console.error("Rewrite API failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "rewrite_failed",
        code: "rewrite_failed",
      },
      { status: 400 }
    );
  }
}
