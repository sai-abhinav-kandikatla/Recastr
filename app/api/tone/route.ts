import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { toneSchema } from "@/lib/ai/schemas";
import { trackServerEvent } from "@/lib/analytics";
import { consumeCredits, creditErrorResponse, requireCredits } from "@/lib/credits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    await requireCredits(user);
    const payload = toneSchema.parse(await request.json());
    const newTone = payload.newTone ?? payload.toTone ?? "Professional";
    const blend = payload.blend ?? 80;
    const rewritten = rewriteTone(payload.content, newTone, blend);
    await trackServerEvent("tone_rewritten", {
      userId: user.id,
      metadata: { tone: newTone, blend },
    });
    await consumeCredits(user);
    return NextResponse.json({ rewritten, content: rewritten });
  } catch (error) {
    const creditResponse = creditErrorResponse(error);
    if (creditResponse) return creditResponse;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "tone_rewrite_failed",
        code: "tone_rewrite_failed",
      },
      { status: 400 },
    );
  }
}

function rewriteTone(content: string, toTone: string, blend: number) {
  const prefix =
    toTone === "Witty"
      ? "Sharper version:\n\n"
      : toTone === "Bold"
        ? "Strong take:\n\n"
        : toTone === "Empathetic"
          ? "Human version:\n\n"
          : toTone === "Controversial"
            ? "Debate angle:\n\n"
            : "";
  const cleaned = content
    .replace(/In today's fast-paced world,?\s*/gi, "")
    .replace(/In conclusion,?\s*/gi, "")
    .trim();
  const cta =
    blend > 65
      ? "\n\nSave this before your next content sprint."
      : "\n\nUse this as a starting point for your next draft.";
  return `${prefix}${cleaned}${cta}`;
}
