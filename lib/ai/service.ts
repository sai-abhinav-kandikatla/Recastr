import { nanoid } from "nanoid";
import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai/client";
import { prisma } from "@/lib/prisma/client";
import { demoProjects } from "@/lib/demo/data";
import { summarySchema } from "@/lib/ai/schemas";
import { isDemoMode } from "@/lib/env";
import type { Platform, SocialOutput, SourceSummary, Tone } from "@/lib/types";

const generationSchema = z.record(z.string(), z.unknown());

const platformPrompt: Record<Platform, string> = {
  TWITTER:
    "Generate one punchy tweet, one 5 tweet thread, and one debate-starting quote-tweet angle. Keep every tweet under 280 characters.",
  LINKEDIN:
    "Generate one short LinkedIn post under 150 words, one long story-led post under 400 words, and one poll with 4 options.",
  INSTAGRAM:
    "Generate one 30-second Reel script, one caption under 150 words, and 20 relevant hashtags without # symbols.",
  FACEBOOK:
    "Generate one Facebook feed post, one poll with 4 options, and one image caption designed for comments and shares.",
  THREADS:
    "Generate one 5-post Threads sequence with conversational pacing, one standalone post, and one reply-bait question.",
  TIKTOK:
    "Generate one 30-second TikTok script, one caption with 8 hashtags, and one comment-bait question. Use fast visual beats.",
  YOUTUBE:
    "Generate one YouTube community post, one Shorts script, and three title ideas with clear viewer transformations.",
  CAROUSEL:
    "Generate a 7-slide carousel with headline, two-line body, and visual suggestion per slide.",
  COMMUNITY:
    "Generate one platform-native community post, one poll with 4 options, and one visual prompt that invites comments.",
  STORY:
    "Generate a 5-slide story sequence with text and visual direction per slide.",
};

export async function summarizeTranscript(transcript: string): Promise<SourceSummary> {
  if (isDemoMode() || !process.env.OPENAI_API_KEY) return demoProjects[0].summary;

  const openai = getOpenAIClient();
  if (!openai) return demoProjects[0].summary;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert content analyst. Return only valid JSON with tldr, takeaways, hooks, detectedTone, topics, and targetAudience.",
      },
      {
        role: "user",
        content: `Transcript:\n${truncateWords(transcript, 6000)}\n\nReturn: tldr string, exactly 5 takeaways, exactly 10 hooks, detectedTone as educational/motivational/controversial/storytelling/news, 3-5 topics, targetAudience.`,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  if (!content) return demoProjects[0].summary;
  return summarySchema.parse(JSON.parse(content));
}

export async function generatePlatformOutputs({
  projectId,
  platforms,
  tone,
}: {
  projectId: string;
  platforms: Platform[];
  tone: Tone | string;
}): Promise<SocialOutput[]> {
  const demoProject = demoProjects.find((item) => item.id === projectId) ?? demoProjects[0];
  if (isDemoMode() || !process.env.OPENAI_API_KEY) {
    return demoProject.outputs
      .filter((output) => platforms.includes(output.platform))
      .map((output) => ({ ...output, tone, createdAt: new Date().toISOString() }));
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { summary: true },
  });
  const summary = project?.summary ? summarySchema.parse(project.summary) : demoProject.summary;
  const generated = await Promise.all(
    platforms.map((platform) => generatePlatformOutput(projectId, platform, tone, summary)),
  );
  return generated;
}

async function generatePlatformOutput(
  projectId: string,
  platform: Platform,
  tone: Tone | string,
  summary: SourceSummary,
): Promise<SocialOutput> {
  const openai = getOpenAIClient();
  if (!openai) {
    const demo = demoProjects[0].outputs.find((output) => output.platform === platform);
    if (demo) return { ...demo, projectId, tone, createdAt: new Date().toISOString() };
  }

  const response = await openai!.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.75,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a world-class creator strategist. Write human, specific, platform-native content. Avoid filler, hype, and generic AI phrasing. Return only valid JSON.",
      },
      {
        role: "user",
        content: `Source intelligence: ${JSON.stringify(summary)}\nTone: ${tone}\nPlatform: ${platform}\nTask: ${platformPrompt[platform]}`,
      },
    ],
  });
  const raw = response.choices[0]?.message.content ?? "{}";
  const content = generationSchema.parse(JSON.parse(raw));

  return {
    id: `output-${nanoid(10)}`,
    projectId,
    platform,
    outputType: `${platform.toLowerCase()} pack`,
    tone,
    content,
    originalContent: content,
    approved: false,
    createdAt: new Date().toISOString(),
  };
}

function truncateWords(value: string, words: number) {
  return value.split(/\s+/).slice(0, words).join(" ");
}
