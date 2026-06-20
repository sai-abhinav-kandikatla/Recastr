import { getGeminiClient } from "@/lib/ai/client";
import { env } from "@/lib/env";
import { normalizePlatformCopy } from "@/lib/platform-limits";
import type { ContentPiece, Platform, SourceSummary, ViralHook } from "@/lib/types";

/**
 * Generate a full content pack (summary, hooks, and platform posts)
 * from YouTube metadata using a single optimised Gemini API call.
 *
 * This is the primary ingestion path — it replaces the hardcoded
 * template functions when Gemini is available.
 *
 * Falls back to `null` so the caller can use legacy template functions.
 */
export async function generateContentPack(
  projectId: string,
  metadata: { title: string; description?: string; transcript?: string },
): Promise<{
  summary: SourceSummary;
  hooks: ViralHook[];
  contents: ContentPiece[];
}> {
  if (!env.geminiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add a valid Gemini API key from Google AI Studio.");
  }

  const apiKey = env.geminiKey.trim();
  if (!apiKey.startsWith("AIzaSy")) {
    throw new Error(
      `Invalid GEMINI_API_KEY format (starts with "${apiKey.slice(0, 8)}..."). ` +
      `Google AI Studio Gemini API keys must start with "AIzaSy". ` +
      `Please check your Vercel/environment configuration.`
    );
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    throw new Error("Failed to initialize Google Gen AI client with the configured key.");
  }

  // Build source material — prefer transcript, fall back to title + description
  const sourceText = metadata.transcript?.trim()
    ? metadata.transcript.trim()
    : buildMetadataSource(metadata.title, metadata.description);

  const prompt = buildContentPackPrompt(metadata.title, sourceText);

  try {
    console.log("[content-pack] Calling Gemini for full content pack generation...");
    console.log("[content-pack] Title:", metadata.title);
    console.log("[content-pack] Source text length:", sourceText.length, "chars");

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text ?? "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    console.log("[content-pack] Gemini response parsed successfully");

    return transformResponse(projectId, parsed, metadata.title);
  } catch (error) {
    console.error("[content-pack] Gemini content pack generation failed:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini API call failed: ${msg}`);
  }
}

function buildMetadataSource(title: string, description?: string): string {
  const parts = [`Video Title: ${title}`];
  if (description?.trim()) {
    parts.push(`Video Description:\n${description.trim()}`);
  }
  return parts.join("\n\n");
}

function buildContentPackPrompt(title: string, sourceText: string): string {
  return `You are a professional social media content strategist and writer. You are given source material from a YouTube video. Your job is to generate a COMPLETE content repurposing pack.

CRITICAL RULES:
1. All content MUST be grounded in the source material provided. Never fabricate quotes, stats, or facts not present or strongly implied.
2. If the source is only a title and description (no transcript), write about the TOPIC and CONCEPTS indicated — do NOT guess what the creator said verbatim.
3. Each post should feel native to its platform. Adapt tone, length, and format accordingly.
4. Never use these banned phrases: "delve", "in conclusion", "it's important to note", "game-changing", "in today's world", "synergy", "leverage", "transformative", "landscape", "testament", "revolutionize".
5. Never mention "Recastr", "content pack", or "platform-native".
6. Write as if YOU are the content creator sharing insights from this video topic.
7. Posts must be specific to the actual topic, not generic advice.

SOURCE MATERIAL:
${sourceText}

VIDEO TITLE: ${title}

Generate the following JSON structure. Return ONLY valid JSON, no markdown fences:

{
  "summary": {
    "tldr": "1-2 sentence summary of the video's main message",
    "takeaways": ["5 specific takeaways from the content"],
    "hooks": ["10 viral hook lines that could open social posts about this topic"],
    "detectedTone": "educational|motivational|controversial|storytelling|news",
    "topics": ["up to 5 topic tags"],
    "targetAudience": "who this content is for (short phrase)"
  },
  "hooks": [
    {
      "text": "viral hook text",
      "hookType": "Curiosity gap|Controversy|Story|Data",
      "reachScore": 75-95
    }
  ],
  "posts": [
    {
      "platform": "TWITTER",
      "contentType": "Tweet",
      "body": "the full post text"
    },
    {
      "platform": "TWITTER",
      "contentType": "Thread",
      "body": "1/ first tweet\\n---\\n2/ second tweet\\n---\\n3/ third tweet"
    },
    {
      "platform": "LINKEDIN",
      "contentType": "LinkedIn post",
      "body": "full linkedin post"
    },
    {
      "platform": "LINKEDIN",
      "contentType": "LinkedIn post",
      "body": "second linkedin post with different angle"
    },
    {
      "platform": "INSTAGRAM",
      "contentType": "Reel script",
      "body": "[HOOK - 0 to 3 sec]\\n...\\n[BODY - 3 to 35 sec]\\n...\\n[CTA - 35 to 60 sec]\\n..."
    },
    {
      "platform": "INSTAGRAM",
      "contentType": "Caption",
      "body": "instagram caption with hashtags at end"
    },
    {
      "platform": "FACEBOOK",
      "contentType": "Facebook post",
      "body": "conversational facebook post"
    },
    {
      "platform": "FACEBOOK",
      "contentType": "Facebook post",
      "body": "second facebook post different angle"
    },
    {
      "platform": "COMMUNITY",
      "contentType": "YouTube community post",
      "body": "community poll or update"
    },
    {
      "platform": "COMMUNITY",
      "contentType": "YouTube community post",
      "body": "second community post"
    },
    {
      "platform": "THREADS",
      "contentType": "Threads post",
      "body": "threads post sequence separated by ---"
    }
  ]
}

IMPORTANT:
- Generate exactly 5 hooks
- Generate at least 2 posts per major platform (TWITTER, LINKEDIN, INSTAGRAM, FACEBOOK, COMMUNITY)
- Generate 1 post for THREADS
- Twitter threads use 1/ 2/ 3/ numbering with --- between tweets
- LinkedIn posts have NO hashtags
- Instagram captions have 5-8 hashtags at the very end after two blank lines
- Facebook posts are conversational, 80-180 words
- Community posts can be polls (A/B/C/D format) or engagement questions
- All posts must be specific to "${title}" — not generic advice`;
}

function transformResponse(
  projectId: string,
  parsed: ContentPackResponse,
  title: string,
): {
  summary: SourceSummary;
  hooks: ViralHook[];
  contents: ContentPiece[];
} {
  const now = new Date().toISOString();

  // --- Summary ---
  const summary: SourceSummary = {
    tldr: parsed.summary?.tldr ?? title,
    takeaways: ensureArray(parsed.summary?.takeaways, 5, `Key insight about ${title}`),
    hooks: ensureArray(parsed.summary?.hooks, 10, `Discover what makes "${title}" worth sharing`),
    detectedTone: validateTone(parsed.summary?.detectedTone),
    topics: ensureArray(parsed.summary?.topics, 5, "content creation"),
    targetAudience: parsed.summary?.targetAudience ?? "Creators and professionals",
  };

  // --- Hooks ---
  const hooks: ViralHook[] = ensureArray(parsed.hooks, 5, null).map(
    (hook: { text?: string; hookType?: string; reachScore?: number } | null, index: number) => ({
      id: `${projectId}-hook-${index + 1}`,
      projectId,
      text: hook?.text ?? summary.hooks[index] ?? `Hook ${index + 1} for "${title}"`,
      hookType: hook?.hookType ?? (index % 2 === 0 ? "Curiosity gap" : "Data"),
      reachScore: hook?.reachScore ?? 85 - index * 2,
    }),
  );

  // --- Content pieces ---
  const posts = ensureArray(parsed.posts, 0, null).filter(
    (post: PostEntry | null): post is PostEntry =>
      post !== null &&
      typeof post.platform === "string" &&
      typeof post.body === "string" &&
      post.body.length > 10,
  );

  const contents: ContentPiece[] = posts.map((post: PostEntry, index: number) => {
    const platform = normalizePlatform(post.platform);
    const normalizedBody = normalizePlatformCopy(platform, post.body);
    return {
      id: `${projectId}-content-${index + 1}`,
      projectId,
      hookId: hooks[index % hooks.length]?.id,
      platform,
      contentType: post.contentType || `${platform} post`,
      body: normalizedBody,
      originalBody: normalizedBody,
      tone: "casual",
      approved: false,
      order: index,
      createdAt: now,
    };
  });

  return { summary, hooks, contents };
}

// --- Helpers ---

type PostEntry = {
  platform: string;
  contentType?: string;
  body: string;
};

type ContentPackResponse = {
  summary?: {
    tldr?: string;
    takeaways?: string[];
    hooks?: string[];
    detectedTone?: string;
    topics?: string[];
    targetAudience?: string;
  };
  hooks?: Array<{ text?: string; hookType?: string; reachScore?: number }>;
  posts?: PostEntry[];
};

function normalizePlatform(raw: string): Platform {
  const upper = raw.toUpperCase().trim();
  const valid: Platform[] = [
    "TWITTER",
    "LINKEDIN",
    "INSTAGRAM",
    "FACEBOOK",
    "THREADS",
    "CAROUSEL",
    "COMMUNITY",
    "STORY",
    "HOOKS",
    "CTA",
  ];
  return valid.includes(upper as Platform) ? (upper as Platform) : "TWITTER";
}

function validateTone(
  tone?: string,
): "educational" | "motivational" | "controversial" | "storytelling" | "news" {
  const valid = ["educational", "motivational", "controversial", "storytelling", "news"] as const;
  if (tone && valid.includes(tone as (typeof valid)[number])) return tone as (typeof valid)[number];
  return "educational";
}

function ensureArray<T>(arr: T[] | undefined, minLength: number, fallback: T): T[] {
  const output = Array.isArray(arr) ? arr : [];
  while (output.length < minLength) output.push(fallback);
  return output;
}
