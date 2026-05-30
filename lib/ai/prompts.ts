import type { GenerationRequest, Platform } from "@/lib/types";

export const SYSTEM_PROMPT =
  "You are a world-class social media strategist who specializes in repurposing long-form content for maximum platform-native engagement. You write in a [TONE] voice for [AUDIENCE]. Never use generic filler phrases like 'In today's fast-paced world' or 'In conclusion'. Always lead with the hook. Always match the platform's native format and culture.";

export function buildGenerationPrompt({
  transcript,
  sourceType,
  platform = "TWITTER",
  tone,
  audience,
  brandVoice,
}: GenerationRequest & { platform?: Platform }) {
  return [
    `SOURCE TRANSCRIPT: ${transcript}`,
    `SOURCE TYPE: ${sourceType.toLowerCase()}`,
    `TARGET PLATFORM: ${platform.toLowerCase()}`,
    `OUTPUT FORMAT: ${platformFormatInstruction(platform)}`,
    `BRAND VOICE: ${
      brandVoice
        ? JSON.stringify({
            name: brandVoice.name,
            toneDescriptors: brandVoice.toneDescriptors,
            bannedWords: brandVoice.bannedWords,
            targetAudience: brandVoice.targetAudience,
            contentPillars: brandVoice.contentPillars,
          })
        : "none"
    }`,
    `TONE: ${tone}`,
    "Generate the requested variations. Return as JSON array with keys: content, hook_score (1-10), estimated_engagement, platform_tips.",
    `AUDIENCE: ${audience}`,
  ].join("\n");
}

export function platformFormatInstruction(platform: Platform) {
  switch (platform) {
    case "TWITTER":
      return "5 single tweets under 280 characters, one 5-8 tweet numbered thread, and one quote tweet bait angle.";
    case "LINKEDIN":
      return "A 150-word short post, a 400-word storytelling post with native line breaks, and a poll with 4 options.";
    case "INSTAGRAM":
      return "A 30-second Reel script, 150-word caption with 30 hashtags, and a 5-slide story sequence.";
    case "CAROUSEL":
      return "A 7-slide carousel with cover, 5 value slides, and CTA slide. Include headline, 2-line body, and visual suggestion.";
    case "COMMUNITY":
      return "A platform-native community post with one comment-driving prompt, one poll with 4 options, and one visual direction.";
    case "STORY":
      return "A 5-slide story sequence with text, visual direction, and interaction prompt.";
  }
}

export function chunkTranscript(transcript: string, maxChars = 24000) {
  if (transcript.length <= maxChars) return [transcript];
  const overlap = 800;
  const chunks: string[] = [];
  for (let start = 0; start < transcript.length; start += maxChars - overlap) {
    chunks.push(transcript.slice(start, start + maxChars));
  }
  return chunks;
}
