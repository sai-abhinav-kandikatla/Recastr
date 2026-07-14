import { generateAIText } from "@/lib/ai/client";
import type { Platform, SocialOutput, Tone } from "@/lib/types";
import {
  assertGeneratedOutputs,
  GenerationPipelineError,
  prepareGenerationSource,
} from "@/lib/v1/generation-validation";

type GenerateV1Options = {
  projectId: string;
  sourceDocument: string;
  platforms: Platform[];
  tone: Tone | string;
  transcriptAvailable: boolean;
  isRegeneration?: boolean;
  previousDrafts?: string[];
  onStage?: (
    stage: "llm_called" | "llm_returned" | "quality_retry" | "posts_parsed",
    metadata?: Record<string, unknown>,
  ) => void;
  onOutput?: (output: SocialOutput) => void;
};

type GeneratedPostsPayload = {
  posts?: Partial<Record<Platform, string[] | Record<string, string>>>;
};

const PLATFORM_LABELS: Partial<Record<Platform, string>> = {
  LINKEDIN: "LinkedIn",
  TWITTER: "Twitter/X",
  INSTAGRAM: "Instagram Caption",
  THREADS: "Threads",
  FACEBOOK: "Facebook",
  COMMUNITY: "YouTube Community",
  CAROUSEL: "Instagram Carousel",
};

const SUPPORTED_PLATFORMS: Platform[] = [
  "LINKEDIN",
  "TWITTER",
  "INSTAGRAM",
  "THREADS",
  "FACEBOOK",
  "COMMUNITY",
  "CAROUSEL",
];

const SOCIAL_GENERATION_MODEL = "meta/llama-3.1-8b-instruct";
const MAX_QUALITY_ATTEMPTS = 5;

const PLATFORM_INSTRUCTIONS: Partial<Record<Platform, string>> = {
  LINKEDIN: `LINKEDIN - return exactly 2 drafts
Write as a creator who just consumed the source and wants to share its most valuable insight with a LinkedIn audience.
Do not summarize or describe the source. Write as if the insight affected your own thinking.
Start directly with the insight or moment. Do not mention "the video", its title, its creator presenting something, or what happens in it. A reader should encounter the idea itself, not a report about where it came from.
Never pretend you personally witnessed or participated in the source moment. First-person voice means sharing your reaction ("I keep thinking about..."), not fabricating an experience ("I stood there..."). For a short source, deepen the reflection on an exact supported detail instead of adding outside facts, quotes, history, motives, statistics, or events.

Use intentionally different angles:
- draft_1: build around the strongest specific fact, exact line, or vivid moment.
- draft_2: build around a contrasting concrete lesson or contrarian reflection.
The drafts must not use the same source detail, takeaway list, argument, question, or repeated sentence.

Format for each draft:
- Line 1: one specific, interesting sentence with no fluff.
- Then 2-4 short paragraphs with whitespace.
- Include a numbered list of 3-5 concrete takeaways only when the source supports that many distinct points; never pad the list with generic advice.
- End with one genuine question or one clear CTA.
- Put 3-5 relevant hashtags on the final line. This line is mandatory.
- Aim for 240-250 words because this model tends to undershoot requested length. Count the words before returning JSON. Expand only with first-person reflection or a concrete application of the same supported insight. Never exceed 250 words, and never return fewer than 150.

Never use: "In today's world", "It's important to", "This video shows", "A video about", "showcases", "demonstrates", "explores the concept", "What can we learn", "Let me know your thoughts", "game changer", "In conclusion", "I hope this helps", or "Don't miss this".`,
  TWITTER: `TWITTER/X - return exactly 3 drafts
Each draft is a complete six-tweet thread sharing the strongest source insight from a different angle. Do not summarize or describe the source.

Rules for each thread:
- Tweet 1: a bold, specific hook under 220 characters. Use a number, name, concrete detail, or surprising fact from the source. Never start with "I watched a video about" or "This video".
- Tweets 2-5: one source-grounded insight per tweet, numbered 1/ through 4/. Use short lines.
- Tweet 6: one natural action such as save this, watch it, or follow for more.
- Keep every tweet at or below 280 characters.
- Never open with "Most people", "Nobody talks about", "Here's the thing", or "The truth is".

Use this exact structure inside each JSON string:
TWEET_1: [hook]
---
TWEET_2: 1/ [insight]
---
TWEET_3: 2/ [insight]
---
TWEET_4: 3/ [insight]
---
TWEET_5: 4/ [insight]
---
TWEET_6: [CTA]`,
  INSTAGRAM: `INSTAGRAM - return exactly 2 drafts
Write as a creator sharing a real moment or insight from the source, not describing it.

Format for each caption:
- First line: a specific surprising fact, genuine curiosity question, or bold source-grounded statement; maximum 125 characters.
- Body: 3-5 short lines. Use -> or checkmarks for a list when useful. Each line must add one concrete insight. Maximum one emoji per line.
- End with one concise CTA such as save this, link in bio, or comment a relevant word.
- Final line: 10-15 relevant hashtags mixing broad and niche terms.
- No long paragraphs and never begin with "This video", "A video about", or "Check out this".`,
  FACEBOOK: `FACEBOOK - return exactly 2 drafts
Write like a creator posting a genuine reaction on a personal Facebook page. Be conversational and human, never corporate. Do not describe the source.

Format for each draft:
- Open with a relatable situation or honest reaction.
- Share the specific source-grounded detail that surprised you.
- Give 3-4 concrete takeaways as a numbered list when the source supports them.
- End with a real question that invites conversation.
- 100-180 words, 2-3 emojis maximum, and no more than 3 hashtags on the final line.
- Never use "This video showcases", "demonstrates", "explores", or "What can we learn".`,
  COMMUNITY: `YOUTUBE COMMUNITY - return exactly 2 drafts
Write like a YouTube creator texting subscribers. Tease the most interesting source-grounded moment without giving everything away.

Format for each draft:
- 2-3 short paragraphs. Aim for 85-95 words because anything above 120 words is invalid. Use 1-2 emojis maximum.
- No hashtags.
- Do not write a formal announcement or start with "Hey everyone" or "I just posted a video about".
- End naturally with exactly "Video is up now 👆" or "Link below 👇".`,
  THREADS: `THREADS - return exactly 2 drafts
Share one sharp, source-grounded reaction in a conversational creator voice. Do not summarize or describe the source.
- Start with the specific moment, fact, or opinion that landed hardest.
- Use short paragraphs and one clear angle per draft.
- 80-180 words.
- End with a natural question or CTA.
- No hashtag block and no generic engagement bait.`,
  CAROUSEL: `INSTAGRAM CAROUSEL - return exactly 2 drafts
Build a five-slide sequence around one specific, source-grounded insight, not a source summary. The two drafts must use different angles.
- Story sequence
- Slide 1: a concrete curiosity hook.
- Slides 2-4: one specific moment, insight, or useful consequence per slide.
- Slide 5: one clear CTA.
- Keep each slide concise and never use placeholder labels such as Hook, Value, or CTA as slide copy.`,
};

const MODE_STRATEGIES: Record<string, string> = {
  professional: `Professional strategy:
- Lead with a clear business observation.
- Use concise, authoritative paragraphs.
- Prioritize practical implications and decision-making.
- Avoid slang, jokes, hype, and emotional narration.`,
  casual: `Casual strategy:
- Sound like a smart creator talking to a friend.
- Use relaxed everyday language and contractions.
- Keep the rhythm easy, conversational, and low-pressure.
- Make the insight feel discovered, not announced.`,
  educational: `Educational strategy:
- Teach one useful idea clearly.
- Explain why it matters and how to apply it.
- Use a simple framework, sequence, or practical example when possible.
- Make the reader leave with a usable takeaway.`,
  entertainment: `Entertainment strategy:
- Lead with curiosity, surprise, or a playful observation.
- Keep energy high without inventing jokes or facts.
- Use vivid phrasing and tension.
- Make the reader want to keep scrolling because the angle is fun.`,
  entertaining: `Entertainment strategy:
- Lead with curiosity, surprise, or a playful observation.
- Keep energy high without inventing jokes or facts.
- Use vivid phrasing and tension.
- Make the reader want to keep scrolling because the angle is fun.`,
  founder: `Founder strategy:
- Frame the idea through tradeoffs, constraints, leadership, or first-principles thinking.
- Sound like someone building in public.
- Include the cost, lesson, or decision behind the insight.
- Avoid polished PR language.`,
  storytelling: `Storytelling strategy:
- Open with a moment, scene, conflict, or turning point.
- Build tension before the lesson.
- Use narrative paragraphs instead of lists.
- End with an insight that feels earned.`,
  "personal brand": `Personal Brand strategy:
- Write from a reflective first-person point of view.
- Make the author sound authentic, specific, and opinionated.
- Connect the source idea to a broader personal lesson.
- Prioritize voice and perspective over generic advice.`,
  personal_brand: `Personal Brand strategy:
- Write from a reflective first-person point of view.
- Make the author sound authentic, specific, and opinionated.
- Connect the source idea to a broader personal lesson.
- Prioritize voice and perspective over generic advice.`,
  viral: `Viral strategy:
- Start with a strong, specific hook.
- Use short paragraphs and a curiosity gap.
- Change the angle, structure, and CTA aggressively.
- Make the post easy to save, reply to, or share without sounding like clickbait.`,
};

export async function generateV1SocialOutputs({
  projectId,
  sourceDocument,
  platforms,
  tone,
  transcriptAvailable,
  isRegeneration = false,
  previousDrafts = [],
  onStage,
  onOutput,
}: GenerateV1Options): Promise<SocialOutput[]> {
  const selectedPlatforms = platforms.filter((platform) => SUPPORTED_PLATFORMS.includes(platform));
  if (selectedPlatforms.length === 0) return [];
  const preparedSource = prepareGenerationSource(sourceDocument);
  const promptSource = selectPromptSource(preparedSource, transcriptAvailable);
  const requestedDraftCount = selectedPlatforms.reduce(
    (count, platform) => count + draftCountForPlatform(platform),
    0,
  );
  const availableWords = promptSource.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  if (availableWords < requestedDraftCount * 4) {
    throw new GenerationPipelineError(
      "INSUFFICIENT_SOURCE_CONTEXT",
      "This source is too short for that many unique posts. Select fewer platforms or add a longer transcript, then try again.",
      422,
      [`The request asked for ${requestedDraftCount} drafts from only ${availableWords} source words.`],
    );
  }

  onStage?.("llm_called", { platformCount: selectedPlatforms.length, transcriptAvailable });

  const generatePlatformDrafts = async (platform: Platform) => {
    const acceptedOutputs: SocialOutput[] = [];
    const targetCount = draftCountForPlatform(platform);

    for (let draftIndex = 0; draftIndex < targetCount; draftIndex += 1) {
      let candidate: SocialOutput[] = [];
      let rejectedDrafts: string[] = [];
      let qualityFeedback: string[] = [];

      for (let attempt = 1; attempt <= MAX_QUALITY_ATTEMPTS; attempt += 1) {
        const draftsToAvoid = [
          ...previousDrafts,
          ...acceptedOutputs.map((output) => String(output.content ?? "")),
          ...rejectedDrafts,
        ].filter(Boolean);
        const regeneration = isRegeneration || attempt > 1 || draftIndex > 0;
        const raw = await generateAIText({
          model: SOCIAL_GENERATION_MODEL,
          prompt: buildMasterPrompt({
            sourceDocument: promptSource,
            platforms: [platform],
            tone,
            transcriptAvailable,
            isRegeneration: regeneration,
            previousDrafts: draftsToAvoid,
            qualityFeedback,
            draftIndex,
            totalDrafts: targetCount,
          }),
          responseMimeType: "application/json",
          temperature: regeneration ? 0.68 : 0.55,
          maxOutputTokens: 2_000,
        });
        onStage?.("llm_returned", {
          responseCharacters: raw.length,
          attempt,
          platform,
          draft: draftIndex + 1,
        });
        candidate = buildSocialOutputs({
          projectId,
          payload: parseGeneratedPosts(raw) ?? { posts: {} },
          platforms: [platform],
          tone,
          targetCountOverride: 1,
          draftIndexOffset: draftIndex,
        });

        try {
          assertGeneratedOutputs({
            outputs: candidate,
            sourceDocument: preparedSource,
            platforms: [platform],
            previousDrafts: [
              ...previousDrafts,
              ...acceptedOutputs.map((output) => String(output.content ?? "")),
            ].filter(Boolean),
            expectedDraftCounts: { [platform]: 1 },
          });
          acceptedOutputs.push(candidate[0]);
          break;
        } catch (error) {
          if (
            !(error instanceof GenerationPipelineError) ||
            error.code !== "INVALID_GENERATED_CONTENT" ||
            attempt === MAX_QUALITY_ATTEMPTS
          ) {
            throw error;
          }

          rejectedDrafts = candidate
            .map((output) => typeof output.content === "string" ? output.content : "")
            .filter(Boolean);
          qualityFeedback = error.reasons;
          onStage?.("quality_retry", {
            reasons: error.reasons,
            attempt: attempt + 1,
            platform,
            draft: draftIndex + 1,
          });
        }
      }
    }

    return acceptedOutputs;
  };

  const outputs = (await Promise.all(selectedPlatforms.map(generatePlatformDrafts))).flat();
  assertGeneratedOutputs({
    outputs,
    sourceDocument: preparedSource,
    platforms: selectedPlatforms,
    previousDrafts,
  });

  onStage?.("posts_parsed", { outputCount: outputs.length });
  outputs.forEach((output) => onOutput?.(output));

  return outputs;
}

function buildSocialOutputs({
  projectId,
  payload,
  platforms,
  tone,
  targetCountOverride,
  draftIndexOffset = 0,
}: {
  projectId: string;
  payload: GeneratedPostsPayload;
  platforms: Platform[];
  tone: Tone | string;
  targetCountOverride?: number;
  draftIndexOffset?: number;
}) {
  const outputs: SocialOutput[] = [];
  const now = new Date().toISOString();

  platforms.forEach((platform, platformIndex) => {
    const drafts = payload.posts?.[platform];
    const draftList = Array.isArray(drafts)
      ? drafts
      : drafts && typeof drafts === "object"
        ? Object.keys(drafts)
            .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
            .map((key) => drafts[key])
        : [];
    const targetCount = targetCountOverride ?? draftCountForPlatform(platform);

    for (let draftIndex = 0; draftIndex < targetCount; draftIndex += 1) {
      const content = normalizeGeneratedPost(draftList[draftIndex] ?? "", platform);
      const label = PLATFORM_LABELS[platform] ?? platform;
      const absoluteDraftIndex = draftIndex + draftIndexOffset;
      const countLabel = draftCountForPlatform(platform) > 1
        ? `${label} - Draft ${absoluteDraftIndex + 1}`
        : label;
      outputs.push({
        id: `${projectId}-v1-${platform.toLowerCase()}-${absoluteDraftIndex + 1}-${Date.now()}-${platformIndex}`,
        projectId,
        platform,
        outputType: countLabel,
        content,
        originalContent: content,
        tone,
        approved: false,
        createdAt: now,
      });
    }
  });

  return outputs;
}

function buildMasterPrompt({
  sourceDocument,
  platforms,
  tone,
  transcriptAvailable,
  isRegeneration,
  previousDrafts,
  qualityFeedback = [],
  draftIndex,
  totalDrafts,
}: {
  sourceDocument: string;
  platforms: Platform[];
  tone: Tone | string;
  transcriptAvailable: boolean;
  isRegeneration: boolean;
  previousDrafts: string[];
  qualityFeedback?: string[];
  draftIndex?: number;
  totalDrafts?: number;
}) {
  const isSingleDraftRequest = typeof draftIndex === "number" && typeof totalDrafts === "number";
  const platformPrompts = platforms
    .map((platform) => {
      const instruction = PLATFORM_INSTRUCTIONS[platform];
      if (!instruction || !isSingleDraftRequest) return instruction;
      return instruction.replace(
        /return exactly \d+ drafts/i,
        `write only draft_${draftIndex + 1} of ${totalDrafts}`,
      );
    })
    .filter((instruction): instruction is string => Boolean(instruction))
    .join("\n\n");
  const responseShape = Object.fromEntries(
    platforms.map((platform) => [
      platform,
      Object.fromEntries(
        Array.from(
          { length: isSingleDraftRequest ? 1 : draftCountForPlatform(platform) },
          (_, index) => [
            `draft_${index + 1}`,
            `<complete publishable ${PLATFORM_LABELS[platform] ?? platform} post with paragraphs inside this one JSON string>`,
          ],
        ),
      ),
    ]),
  );

  const normalizedTone = normalizeTone(tone);
  const modeStrategy = MODE_STRATEGIES[normalizedTone] ?? MODE_STRATEGIES.professional;
  const variationSeed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const previousBlock = previousDrafts.length
    ? `Previous drafts to avoid. Do not reuse their hooks, openings, paragraph structure, or CTA:\n${previousDrafts
        .slice(0, 8)
        .map((draft, index) => `DRAFT ${index + 1}:\n${draft.slice(0, 1200)}`)
        .join("\n\n")}`
    : "No previous drafts were supplied.";
  const feedbackBlock = qualityFeedback.length
    ? `QUALITY CHECKS FAILED ON THE PREVIOUS RESPONSE:\n${qualityFeedback
        .map((reason) => `- ${reason}`)
        .join("\n")}\nCorrect every listed issue in this response.`
    : "No previous quality failures were supplied.";

  return `You are a creator who has just consumed the source material and wants to share what was most valuable, surprising, useful, or emotionally resonant.

Answer this question: "What is the most shareable moment or insight here?"
Never answer: "What is this source about?"

GLOBAL RULES:
- Do not summarize the source or write a video description.
- Do not narrate what the source, video, transcript, or creator does.
- Write from the perspective of a person sharing what hit them, changed their mind, taught them something specific, or made them curious.
- Ground every claim in a concrete fact, name, number, quote, action, tension, or moment present in the supplied material.
- Never invent missing details. When only metadata and a description are available, choose the strongest supported insight and state no more than the evidence allows.
- Every draft must be genuinely different in angle, hook, structure, CTA, wording, and ending. Reworded duplicates are invalid.
- Never use: "This video shows", "A video about", "showcases", "demonstrates", "explores the concept", "What can we learn", "game changer", "In conclusion", "I hope this helps", or "Let me know your thoughts".
- Output only publishable copy inside the required JSON. Never include analysis, labels outside a platform's requested format, prompt text, or explanations.

PLATFORM-SPECIFIC INSTRUCTIONS:
${platformPrompts}

Tone preference: ${tone}
${modeStrategy}

${isRegeneration ? "This is a regeneration. Produce genuinely new drafts: new hooks, new angles, new structures, new CTAs. Keep the same facts and meaning." : ""}
Variation seed: ${variationSeed}
Transcript available: ${transcriptAvailable ? "yes" : "no"}

${previousBlock}

${feedbackBlock}

${isSingleDraftRequest
    ? `DRAFT ASSIGNMENT: Write only draft_${draftIndex + 1} of ${totalDrafts}. Follow the angle assigned to draft_${draftIndex + 1}. Do not return any other draft.`
    : ""}

Requested platform keys: ${platforms.join(", ")}

Return only valid JSON matching this exact requested-platform shape:
${JSON.stringify({ posts: responseShape }, null, 2)}

Replace every angle-bracket placeholder with complete publishable copy. Each draft value must be one JSON string containing the entire post; encode paragraph breaks as \\n inside that string. Never split a post's paragraphs, list items, or tweets into additional draft fields. Include no platform keys or draft keys other than those shown.

${transcriptAvailable ? "VIDEO TRANSCRIPT AND SOURCE DETAILS" : "VIDEO METADATA AND DESCRIPTION (NO TRANSCRIPT AVAILABLE)"}:
${sourceDocument}`;
}

function parseGeneratedPosts(raw: string): GeneratedPostsPayload | null {
  const direct = tryParseJson(raw);
  if (direct) return direct;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const fromFence = fenced ? tryParseJson(fenced) : null;
  if (fromFence) return fromFence;

  const objectMatch = raw.match(/\{[\s\S]*\}/);
  const fromObject = objectMatch ? tryParseJson(objectMatch[0]) : null;
  return fromObject;
}

function tryParseJson(value: string): GeneratedPostsPayload | null {
  try {
    const parsed = JSON.parse(value) as GeneratedPostsPayload;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function cleanGeneratedPost(value: string) {
  return value
    .replace(/^["']|["']$/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeGeneratedPost(value: string, platform: Platform) {
  const cleaned = cleanGeneratedPost(value);
  if (platform !== "TWITTER") return cleaned;

  const sections = cleaned.split(/\n\s*---\s*\n/).map((section) => section.trim());
  if (sections.length !== 6) return cleaned;

  return sections
    .map((section, index) => {
      const tweet = section.replace(/^TWEET_\d+:\s*/i, "").trim();
      return `TWEET_${index + 1}: ${tweet}`;
    })
    .join("\n---\n");
}

function selectPromptSource(sourceDocument: string, transcriptAvailable: boolean) {
  if (!transcriptAvailable) return sourceDocument;
  const transcript = sourceDocument.match(
    /(?:^|\n)Transcript:\s*([\s\S]*?)(?:\n\s*END OF SOURCE\s*$|$)/i,
  )?.[1]?.trim();
  return transcript ? `Transcript:\n${transcript}` : sourceDocument;
}

function normalizeTone(tone: Tone | string) {
  return String(tone).trim().toLowerCase().replace(/-/g, " ").replace(/_/g, " ");
}

function draftCountForPlatform(platform: Platform) {
  return platform === "TWITTER" ? 3 : 2;
}
