import { NextResponse } from "next/server";
import { SourceSummary } from "@/lib/types";
import { getRequestUser } from "@/lib/auth";
import { toneSchema } from "@/lib/ai/schemas";
import { trackServerEvent } from "@/lib/analytics";
import { creditErrorResponse, requireCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma/client";
import { generateAIText } from "@/lib/ai/client";
import { cleanupPost } from "@/lib/ai/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

const bannedAiOpeners = [
  "Have you ever wondered",
  "In today's world",
  "In this video",
  "The creator explains",
  "Here are",
  "Let's dive into",
  "It is important to",
  "Unlock the power",
];

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    await requireCredits(user);
    const payload = toneSchema.parse(await request.json());
    const newTone = payload.newTone ?? payload.toTone ?? payload.tone ?? "Casual";
    const normalizedTone = normalizeMode(newTone);
    const isRegen = payload.regenerate === true;

    let projectTitle = "";
    let sourceDocument = "";
    let projectSummary: SourceSummary | null = null;
    let platform = "social media";
    const previousDrafts: string[] = [payload.content].filter(Boolean);

    if (payload.contentId) {
      const existingContent = await prisma.content.findUnique({
        where: { id: payload.contentId },
        include: {
          project: {
            include: {
              contents: {
                orderBy: { createdAt: "desc" },
                take: 10,
              },
            },
          },
        },
      });
      if (existingContent) {
        platform = existingContent.platform;
        projectTitle = existingContent.project?.title ?? "";
        sourceDocument = existingContent.project?.sourceText || existingContent.project?.transcript || "";
        projectSummary = existingContent.project?.summary as SourceSummary | null;
        previousDrafts.push(
          ...(existingContent.project?.contents ?? [])
            .filter((content) => content.platform === existingContent.platform)
            .map((content) => content.body),
        );
      }
    }

    let rewritten = "";
    try {
      const prompt = isRegen
        ? buildRegeneratePrompt({
            platform,
            mode: normalizedTone,
            projectTitle,
            sourceDocument,
            projectSummary,
            previousDrafts,
          })
        : buildRewritePrompt({
            platform,
            mode: normalizedTone,
            original: payload.content,
            projectTitle,
            sourceDocument,
            projectSummary,
          });

      const response = await generateAIText({
        prompt,
        temperature: isRegen ? 0.94 : 0.82,
        maxOutputTokens: 1400,
      });
      rewritten = ensureDifferent(cleanHumanPost(cleanupPost(response)), payload.content, normalizedTone);
    } catch (aiError) {
      console.error("Tone rewrite API failed, falling back to local generator:", aiError);
      rewritten = isRegen
        ? fallbackLocalRegenerate(projectSummary, platform, projectTitle, normalizedTone, payload.content)
        : fallbackLocalRewrite(payload.content, normalizedTone);
    }

    await trackServerEvent(isRegen ? "content_generated" : "tone_rewritten", {
      userId: user.id,
      metadata: {
        tone: newTone,
        mode: normalizedTone,
        ...(payload.contentId !== undefined ? { contentId: payload.contentId } : {}),
      },
    });

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

function buildRewritePrompt({
  platform,
  mode,
  original,
  projectTitle,
  sourceDocument,
  projectSummary,
}: {
  platform: string;
  mode: string;
  original: string;
  projectTitle: string;
  sourceDocument: string;
  projectSummary: SourceSummary | null;
}) {
  return `${baseCopywriterInstruction(mode)}

Rewrite the existing ${platform} post in the "${mode}" mode.

This must be a real rewrite, not light word substitution:
- Change the opening.
- Change the structure.
- Change paragraph rhythm.
- Keep the same factual meaning.
- Preserve source accuracy.
- Do not include facts that are not in the source.

Original post:
"""
${original}
"""

Project title for context only. Do not open with it:
${projectTitle}

Source summary:
${JSON.stringify(projectSummary ?? {}, null, 2)}

Source document:
${sourceDocument.slice(0, 7000)}

Return only the rewritten post.`;
}

function buildRegeneratePrompt({
  platform,
  mode,
  projectTitle,
  sourceDocument,
  projectSummary,
  previousDrafts,
}: {
  platform: string;
  mode: string;
  projectTitle: string;
  sourceDocument: string;
  projectSummary: SourceSummary | null;
  previousDrafts: string[];
}) {
  const variationSeed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${baseCopywriterInstruction(mode)}

Write a completely new ${platform} post from the same source.

Regeneration rules:
- Never return the same post.
- Do not reuse the same hook.
- Do not reuse the same paragraph structure.
- Do not reuse the same CTA.
- Keep factual accuracy and preserve the source meaning.
- Choose a new angle that still belongs to the source.

Previous drafts to avoid:
${previousDrafts
  .slice(0, 8)
  .map((draft, index) => `DRAFT ${index + 1}:\n${draft.slice(0, 1200)}`)
  .join("\n\n")}

Project title for context only. Do not open with it:
${projectTitle}

Source summary:
${JSON.stringify(projectSummary ?? {}, null, 2)}

Source document:
${sourceDocument.slice(0, 8000)}

Variation seed: ${variationSeed}

Return only the new post.`;
}

function baseCopywriterInstruction(mode: string) {
  return `You are an experienced human creator and copywriter.

${modeStrategy(mode)}

Universal rules:
- Never sound like ChatGPT.
- Never write a generic summary.
- Never start with ${bannedAiOpeners.map((phrase) => `"${phrase}"`).join(", ")}.
- Never say "the creator", "this video", "this transcript", or "according to the video".
- Never invent facts.
- Use specific details from the source.
- Output raw post text only.`;
}

function modeStrategy(mode: string) {
  switch (mode) {
    case "professional":
      return "Professional: authoritative, concise, business-focused, polished. Lead with the strategic implication.";
    case "casual":
      return "Casual: conversational, relaxed, simple language. Sound like a smart friend explaining the useful part.";
    case "educational":
      return "Educational: teach clearly, explain the why, include a practical framework or step sequence when useful.";
    case "entertainment":
    case "entertaining":
      return "Entertainment: curiosity-driven, lively, playful where appropriate, high-energy without making things up.";
    case "founder":
      return "Founder: startup mindset, tradeoffs, leadership, constraints, first-principles thinking, honest lessons.";
    case "storytelling":
      return "Storytelling: narrative arc, tension, conflict, resolution, emotional specificity, lesson earned at the end.";
    case "personal brand":
    case "personal_brand":
      return "Personal Brand: reflective, authentic, first-person perspective, strong point of view, personal growth.";
    case "viral":
      return "Viral: strong hook, short paragraphs, curiosity gap, high engagement, clear payoff, shareable ending.";
    default:
      return "Casual: conversational, relaxed, simple language. Sound like a smart friend explaining the useful part.";
  }
}

function cleanHumanPost(value: string) {
  let cleaned = value.replace(/^["']|["']$/g, "").replace(/\n{3,}/g, "\n\n").trim();
  for (const phrase of bannedAiOpeners) {
    cleaned = cleaned.replace(new RegExp(`^${escapeRegExp(phrase)}[:,.\\s-]*`, "i"), "");
  }
  return cleaned.trim();
}

function ensureDifferent(next: string, previous: string, mode: string) {
  if (normalizeForComparison(next) !== normalizeForComparison(previous)) return next;
  return fallbackLocalRewrite(previous, mode);
}

function fallbackLocalRewrite(content: string, mode: string) {
  const cleaned = cleanHumanPost(content);
  if (mode === "professional") return `The useful signal is easy to miss.\n\n${cleaned}\n\nThe practical takeaway: make the idea easier to act on, not louder.`;
  if (mode === "educational") return `A simple way to think about it:\n\n1. Notice the pattern.\n2. Find the constraint.\n3. Turn the lesson into one next action.\n\n${cleaned}`;
  if (mode === "storytelling") return `There is a moment where the lesson becomes obvious.\n\n${cleaned}\n\nThat is usually where the best post starts.`;
  if (mode === "founder") return `The founder lesson here is about tradeoffs.\n\n${cleaned}\n\nEvery useful decision has a cost. The point is knowing which cost you are choosing.`;
  if (mode === "personal brand" || mode === "personal_brand") return `I keep coming back to this idea:\n\n${cleaned}\n\nThe lesson is not to copy the tactic. It is to understand the judgment behind it.`;
  if (mode === "viral") return `This is the part people will remember:\n\n${cleaned}\n\nSave this before you need the reminder.`;
  if (mode === "entertainment" || mode === "entertaining") return `This gets interesting fast.\n\n${cleaned}\n\nThe best part is how simple the lesson becomes once you see it.`;
  return `${cleaned}\n\nWorth keeping in mind next time.`;
}

function fallbackLocalRegenerate(
  projectSummary: SourceSummary | null,
  platform: string,
  projectTitle: string,
  mode: string,
  previous: string,
) {
  const seed =
    projectSummary?.takeaways?.find((item) => item && !previous.includes(item)) ||
    projectSummary?.hooks?.find((item) => item && !previous.includes(item)) ||
    projectSummary?.tldr ||
    projectTitle;
  return fallbackLocalRewrite(`${seed}\n\nA different angle is often more useful than a louder version of the same post.`, mode);
}

function normalizeMode(value: string) {
  return String(value || "casual").trim().toLowerCase().replace(/-/g, " ").replace(/_/g, " ");
}

function normalizeForComparison(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
