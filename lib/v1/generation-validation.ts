import type { Platform, SocialOutput } from "@/lib/types";

export type GenerationPipelineErrorCode =
  | "INSUFFICIENT_SOURCE_CONTEXT"
  | "INVALID_GENERATED_CONTENT";

export class GenerationPipelineError extends Error {
  constructor(
    public readonly code: GenerationPipelineErrorCode,
    public readonly userMessage: string,
    public readonly status: number,
    public readonly reasons: string[] = [],
  ) {
    super(reasons[0] ?? userMessage);
    this.name = "GenerationPipelineError";
  }
}

const SOURCE_PLACEHOLDER_PATTERNS = [
  /^\s*Transcript:\s*Transcript (?:was |is )?unavailable[^\n]*$/gim,
  /^\s*Transcript (?:was |is )?unavailable[^\n]*$/gim,
  /^\s*Generated posts will rely on metadata and description[^\n]*$/gim,
  /^\s*Use only the metadata[^\n]*$/gim,
  /^\s*Do not invent details[^\n]*$/gim,
  /^\s*No description (?:was )?available\.?\s*$/gim,
];

const REJECTED_OUTPUT_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "transcript fallback text", pattern: /transcript (?:was |is )?unavailable/i },
  { label: "empty-generation fallback text", pattern: /generation returned an empty draft/i },
  { label: "source-review template", pattern: /review the source details/i },
  { label: "rewrite template", pattern: /rewrite this draft/i },
  { label: "metadata instruction", pattern: /use only the metadata/i },
  { label: "grounding instruction", pattern: /do not invent details/i },
  { label: "internal source label", pattern: /\bsource document\b/i },
  { label: "prompt role text", pattern: /you are an experienced human social media copywriter/i },
  { label: "prompt requirements", pattern: /\b(?:hard rules|draft requirements|requested platforms):/i },
  { label: "prompt response instruction", pattern: /return only valid json/i },
  { label: "prompt variation seed", pattern: /variation seed:/i },
  { label: "internal instructions", pattern: /\b(?:system prompt|developer instructions?|internal prompt)\b/i },
  { label: "AI disclaimer", pattern: /\bas an ai(?: language model)?\b/i },
  { label: "fallback draft marker", pattern: /^\s*\[Draft\s+\d+\]/i },
  { label: "JSON example placeholder", pattern: /(?:Tweet|Post|Caption)\s+\d+\s+(?:text|\.\.\.)/i },
  { label: "carousel example placeholder", pattern: /Slide\s+\d+:\s*(?:\[?(?:Hook|Value|CTA)\]?|content\.\.\.|Slide title)/i },
  { label: "video-description framing", pattern: /\b(?:this|the|a) video (?:shows?|showcases?|demonstrates?|explores?|describes?|is about|focuses on|features?)\b/i },
  { label: "video narration", pattern: /\b(?:in|from|throughout) (?:the )?(?:first(?:-ever)? )?(?:youtube )?video\b/i },
  { label: "video narration", pattern: /\b(?:the|this|a) (?:first(?:-ever)? )?(?:youtube )?video (?:highlights?|uses?|says?|shares?|opens?|starts?|focuses?|reminds?)\b/i },
  { label: "creator narration", pattern: /\b(?:the )?creator(?:,? [\p{L}.-]+){0,3} (?:uses?|says?|shares?|shows?|explains?|focuses?)\b/iu },
  { label: "fabricated source participation", pattern: /\b(?:as|when) i (?:stood|watched|listened|sat|spoke|walked|visited)\b/i },
  { label: "source euphemism", pattern: /\b(?:a|the) recent (?:conversation|video|clip|recording)\b/i },
  { label: "summary verb", pattern: /\b(?:showcases?|demonstrates?|explores the concept)\b/i },
  { label: "generic learning question", pattern: /\bwhat can we learn\b/i },
  { label: "generic AI copy", pattern: /\b(?:game[ -]?changer|in conclusion|i hope this helps|let me know your thoughts|don't miss this)\b/i },
  { label: "response-schema placeholder", pattern: /complete publishable .* (?:draft|post)/i },
];

const FORBIDDEN_OPENERS = [
  "in this video",
  "the creator says",
  "this transcript",
  "this video explains",
  "according to the video",
  "have you ever wondered",
  "in today's world",
  "here are",
  "let's dive into",
  "it is important to",
  "unlock the power",
];

const SOURCE_STOP_WORDS = new Set([
  "about", "above", "after", "again", "also", "available", "before", "being", "channel",
  "content", "creator", "date", "description", "details", "duration", "from", "generation",
  "information", "into", "metadata", "only", "published", "ready", "source", "status", "summary",
  "that", "their", "there", "these", "this", "title", "transcript", "unknown", "video", "what",
  "when", "where", "which", "with", "would", "your",
]);

export function prepareGenerationSource(sourceDocument: string) {
  const sanitized = SOURCE_PLACEHOLDER_PATTERNS.reduce(
    (value, pattern) => value.replace(pattern, ""),
    sourceDocument,
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const meaningfulTerms = significantTokens(sanitized);

  if (sanitized.length < 24 || meaningfulTerms.length < 5 || new Set(meaningfulTerms).size < 4) {
    throw new GenerationPipelineError(
      "INSUFFICIENT_SOURCE_CONTEXT",
      "We could not find enough source information to create accurate posts. Add a transcript or a more detailed description, then try again.",
      422,
      ["The source did not contain enough distinct, meaningful terms."],
    );
  }

  return sanitized;
}

export function assertGeneratedOutputs({
  outputs,
  sourceDocument,
  platforms,
  previousDrafts = [],
  expectedDraftCounts,
}: {
  outputs: SocialOutput[];
  sourceDocument: string;
  platforms: Platform[];
  previousDrafts?: string[];
  expectedDraftCounts?: Partial<Record<Platform, number>>;
}) {
  const sanitizedSource = prepareGenerationSource(sourceDocument);
  const sourceTerms = new Set(significantTokens(sanitizedSource));
  const reasons: string[] = [];
  const requestedPlatforms = Array.from(new Set(platforms));

  for (const platform of requestedPlatforms) {
    const expected = expectedDraftCounts?.[platform] ?? draftCountForPlatform(platform);
    const actual = outputs.filter((output) => output.platform === platform).length;
    if (actual !== expected) {
      reasons.push(`${platform} returned ${actual} drafts; expected ${expected}.`);
    }
  }

  if (outputs.some((output) => !requestedPlatforms.includes(output.platform))) {
    reasons.push("The provider returned a draft for an unrequested platform.");
  }

  const drafts = outputs.map((output, index) => {
    const content = typeof output.content === "string" ? output.content.trim() : "";
    if (!content) {
      reasons.push(`${output.platform} draft ${index + 1} was empty or not text.`);
      return { content, output };
    }

    const rejected = rejectedContentReason(content);
    if (rejected) reasons.push(`${output.platform} draft ${index + 1} contained ${rejected}.`);
    const originalContent = output.originalContent ?? content;
    const rejectedOriginal = rejectedContentReason(
      typeof originalContent === "string" ? originalContent : "",
    );
    if (rejectedOriginal) {
      reasons.push(`${output.platform} draft ${index + 1} contained ${rejectedOriginal} in its original content.`);
    }

    const lower = content.toLowerCase();
    const badOpener = FORBIDDEN_OPENERS.find((phrase) => lower.startsWith(phrase));
    if (badOpener) reasons.push(`${output.platform} draft ${index + 1} used a forbidden opener.`);

    const minimumLength = output.platform === "TWITTER" ? 40 : output.platform === "CAROUSEL" ? 120 : 60;
    if (content.length < minimumLength || tokenize(content).length < 8) {
      reasons.push(`${output.platform} draft ${index + 1} was too thin to publish.`);
    }

    const draftTerms = new Set(significantTokens(content));
    const overlap = Array.from(draftTerms).filter((term) => sourceTerms.has(term)).length;
    const requiredOverlap = content.length <= 140 ? 1 : 2;
    if (overlap < requiredOverlap) {
      reasons.push(`${output.platform} draft ${index + 1} was not grounded in the source.`);
    }
    const unsupportedNumbers = unsupportedNumericClaims(content, sanitizedSource);
    if (unsupportedNumbers.length > 0) {
      reasons.push(
        `${output.platform} draft ${index + 1} introduced unsupported numbers: ${unsupportedNumbers.join(", ")}.`,
      );
    }

    const wordCount = tokenize(content).length;
    const hashtagCount = content.match(/#\p{L}[\p{L}\p{N}_]*/gu)?.length ?? 0;
    if (output.platform === "LINKEDIN" && (wordCount < 150 || wordCount > 250)) {
      reasons.push(`LINKEDIN draft ${index + 1} was outside the 150-250 word range.`);
    }
    if (output.platform === "LINKEDIN" && (hashtagCount < 3 || hashtagCount > 5)) {
      reasons.push(`LINKEDIN draft ${index + 1} did not contain 3-5 hashtags.`);
    }
    if (output.platform === "TWITTER" && !hasCompleteTwitterThread(content)) {
      reasons.push(`TWITTER draft ${index + 1} did not contain the required six-tweet thread.`);
    }
    if (output.platform === "INSTAGRAM" && (hashtagCount < 10 || hashtagCount > 15)) {
      reasons.push(`INSTAGRAM draft ${index + 1} did not contain 10-15 hashtags.`);
    }
    if (output.platform === "FACEBOOK" && (wordCount < 100 || wordCount > 180)) {
      reasons.push(`FACEBOOK draft ${index + 1} was outside the 100-180 word range.`);
    }
    if (output.platform === "FACEBOOK" && hashtagCount > 3) {
      reasons.push(`FACEBOOK draft ${index + 1} contained more than 3 hashtags.`);
    }
    if (output.platform === "COMMUNITY" && (wordCount < 80 || wordCount > 120)) {
      reasons.push(`COMMUNITY draft ${index + 1} was outside the 80-120 word range.`);
    }
    if (output.platform === "COMMUNITY" && hashtagCount > 0) {
      reasons.push(`COMMUNITY draft ${index + 1} contained hashtags.`);
    }
    if (output.platform === "CAROUSEL" && !hasCompleteCarousel(content)) {
      reasons.push(`CAROUSEL draft ${index + 1} did not contain a complete five-slide sequence.`);
    }

    return { content, output };
  });

  for (let left = 0; left < drafts.length; left += 1) {
    for (let right = left + 1; right < drafts.length; right += 1) {
      if (areRepeatedDrafts(drafts[left].content, drafts[right].content)) {
        reasons.push(
          `${drafts[left].output.platform} and ${drafts[right].output.platform} contained repeated drafts.`,
        );
      }
    }
  }

  for (const draft of drafts) {
    if (previousDrafts.some((previous) => areRepeatedDrafts(draft.content, previous, 0.9))) {
      reasons.push(`${draft.output.platform} repeated a previously generated draft.`);
    }
  }

  if (reasons.length > 0) {
    throw new GenerationPipelineError(
      "INVALID_GENERATED_CONTENT",
      "The AI response did not meet our quality checks. No drafts were saved. Please retry generation.",
      502,
      Array.from(new Set(reasons)),
    );
  }
}

export function isRejectedGeneratedContent(value: unknown) {
  return typeof value !== "string" || !value.trim() || Boolean(rejectedContentReason(value));
}

function rejectedContentReason(content: string) {
  return REJECTED_OUTPUT_PATTERNS.find(({ pattern }) => pattern.test(content))?.label;
}

function hasCompleteCarousel(content: string) {
  return [1, 2, 3, 4, 5].every((slide) => new RegExp(`Slide\\s+${slide}:`, "i").test(content));
}

function hasCompleteTwitterThread(content: string) {
  const sections = content.split(/\n\s*---\s*\n/).map((section) => section.trim());
  if (sections.length !== 6) return false;

  return sections.every((section, index) => {
    if (!new RegExp(`^TWEET_${index + 1}:`, "i").test(section)) return false;
    const tweet = section.replace(/^TWEET_\d+:\s*/i, "").trim();
    if (!tweet || tweet.length > 280) return false;
    if (index >= 1 && index <= 4 && !new RegExp(`^${index}\/`).test(tweet)) return false;
    return true;
  });
}

function areRepeatedDrafts(left: string, right: string, threshold = 0.84) {
  const normalizedLeft = normalizeForComparison(left);
  const normalizedRight = normalizeForComparison(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  if (shareLongPhrase(normalizedLeft, normalizedRight)) return true;

  const leftTokens = new Set(tokenize(normalizedLeft));
  const rightTokens = new Set(tokenize(normalizedRight));
  if (leftTokens.size < 6 || rightTokens.size < 6) return false;
  const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 && intersection / union >= threshold;
}

function shareLongPhrase(left: string, right: string, phraseLength = 12) {
  const leftTokens = tokenize(left);
  const rightText = ` ${tokenize(right).join(" ")} `;
  if (leftTokens.length < phraseLength) return false;

  for (let index = 0; index <= leftTokens.length - phraseLength; index += 1) {
    const phrase = ` ${leftTokens.slice(index, index + phraseLength).join(" ")} `;
    if (rightText.includes(phrase)) return true;
  }
  return false;
}

function unsupportedNumericClaims(content: string, sourceDocument: string) {
  const withoutFormatNumbers = content
    .replace(/^\s*TWEET_\d+:\s*/gim, "")
    .replace(/^\s*(?:Slide\s+)?\d+\s*[\/.):+-]\s*/gim, "");
  const sourceNumbers = new Set(extractNumbers(sourceDocument));
  return Array.from(new Set(extractNumbers(withoutFormatNumbers))).filter(
    (number) => !sourceNumbers.has(number),
  );
}

function extractNumbers(value: string) {
  return value.match(/\b\d+(?:[.,]\d+)*(?:%|k|m|b)?\b/gi)?.map((item) => item.toLowerCase()) ?? [];
}

function significantTokens(value: string) {
  return tokenize(value).filter((token) => token.length >= 4 && !SOURCE_STOP_WORDS.has(token));
}

function tokenize(value: string) {
  return value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function normalizeForComparison(value: string) {
  return tokenize(value).join(" ");
}

function draftCountForPlatform(platform: Platform) {
  return platform === "TWITTER" ? 3 : 2;
}
