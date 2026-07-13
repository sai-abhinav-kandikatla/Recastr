import axios from "axios";
import { getYouTubeTranscript } from "@/lib/transcript";

export type YouTubeSource = {
  videoId: string;
  url: string;
  title: string;
  description: string;
  channelName: string;
  publishedDate: string;
  durationSeconds: number;
  thumbnailUrl?: string;
  transcript: string;
  transcriptStatus: "available" | "missing";
  warning?: string;
  sourceDocument: string;
};

type OEmbedResponse = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

type PlayerResponse = {
  videoDetails?: {
    title?: string;
    author?: string;
    shortDescription?: string;
    lengthSeconds?: string;
    thumbnail?: {
      thumbnails?: Array<{ url?: string }>;
    };
  };
  microformat?: {
    playerMicroformatRenderer?: {
      title?: { simpleText?: string };
      description?: { simpleText?: string };
      ownerChannelName?: string;
      publishDate?: string;
      uploadDate?: string;
      lengthSeconds?: string;
      thumbnail?: {
        thumbnails?: Array<{ url?: string }>;
      };
    };
  };
};

export function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      return sanitizeVideoId(parsed.pathname.split("/").filter(Boolean)[0]);
    }

    if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
      const directId = parsed.searchParams.get("v");
      if (directId) return sanitizeVideoId(directId);

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live", "v"].includes(parts[0] ?? "")) {
        return sanitizeVideoId(parts[1]);
      }
    }
  } catch {
    const looseMatch = rawUrl.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
    return sanitizeVideoId(looseMatch?.[1]);
  }

  return null;
}

export function normalizeYouTubeUrl(rawUrl: string) {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL. Paste a public youtube.com or youtu.be video URL.");
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function extractYouTubeSource(rawUrl: string): Promise<YouTubeSource> {
  const url = normalizeYouTubeUrl(rawUrl);
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL. Paste a public youtube.com or youtu.be video URL.");
  }

  const [oembed, page, transcriptResult] = await Promise.all([
    fetchOEmbed(url),
    fetchWatchPage(url),
    getYouTubeTranscript(url),
  ]);

  const player = page.playerResponse;
  const microformat = player?.microformat?.playerMicroformatRenderer;
  const details = player?.videoDetails;
  const transcript = transcriptResult.success ? transcriptResult.transcript?.trim() ?? "" : "";
  const title =
    cleanText(oembed.title) ||
    cleanText(details?.title) ||
    cleanText(microformat?.title?.simpleText) ||
    `YouTube video ${videoId}`;
  const description =
    cleanText(details?.shortDescription) ||
    cleanText(microformat?.description?.simpleText) ||
    cleanText(page.description);
  const channelName =
    cleanText(oembed.author_name) ||
    cleanText(details?.author) ||
    cleanText(microformat?.ownerChannelName) ||
    "Unknown channel";
  const publishedDate = cleanText(microformat?.publishDate) || cleanText(microformat?.uploadDate) || "Unknown";
  const durationSeconds = Number(details?.lengthSeconds ?? microformat?.lengthSeconds ?? 0) || 0;
  const thumbnailUrl =
    oembed.thumbnail_url ||
    lastThumbnail(details?.thumbnail?.thumbnails) ||
    lastThumbnail(microformat?.thumbnail?.thumbnails) ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const warning = transcript
    ? undefined
    : transcriptResult.reason || "Transcript was not available. Generated posts will rely on metadata and description.";

  const source: Omit<YouTubeSource, "sourceDocument"> = {
    videoId,
    url,
    title,
    description,
    channelName,
    publishedDate,
    durationSeconds,
    thumbnailUrl,
    transcript,
    transcriptStatus: transcript ? "available" : "missing",
    warning,
  };

  return {
    ...source,
    sourceDocument: buildSourceDocument(source),
  };
}

export function buildSourceDocument(source: Omit<YouTubeSource, "sourceDocument">) {
  return [
    "VIDEO INFORMATION",
    "",
    "Title:",
    source.title || "Unknown",
    "",
    "Channel:",
    source.channelName || "Unknown",
    "",
    "Published Date:",
    source.publishedDate || "Unknown",
    "",
    "Video Duration:",
    source.durationSeconds ? formatDuration(source.durationSeconds) : "Unknown",
    "",
    "Description:",
    source.description || "No description available.",
    "",
    "Transcript:",
    source.transcript || "Transcript unavailable. Use only the metadata and description above. Do not invent details.",
    "",
    "END OF SOURCE",
  ].join("\n");
}

async function fetchOEmbed(url: string): Promise<OEmbedResponse> {
  try {
    const response = await axios.get<OEmbedResponse>("https://www.youtube.com/oembed", {
      params: { url, format: "json" },
      headers: browserHeaders(),
      timeout: 5000,
    });
    return response.data;
  } catch {
    return {};
  }
}

async function fetchWatchPage(url: string): Promise<{ description: string; playerResponse: PlayerResponse | null }> {
  try {
    const response = await axios.get<string>(url, {
      headers: browserHeaders(),
      timeout: 10000,
    });
    const html = response.data;
    return {
      description: readMeta(html, "description") || readMeta(html, "og:description") || "",
      playerResponse: extractInitialPlayerResponse(html),
    };
  } catch {
    return { description: "", playerResponse: null };
  }
}

function extractInitialPlayerResponse(html: string): PlayerResponse | null {
  const markers = ["ytInitialPlayerResponse = ", "ytInitialPlayerResponse=", "window[\"ytInitialPlayerResponse\"] = "];
  for (const marker of markers) {
    const raw = extractBalancedObjectAfter(html, marker);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as PlayerResponse;
    } catch {
      continue;
    }
  }
  return null;
}

function extractBalancedObjectAfter(value: string, marker: string) {
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return "";
  const start = value.indexOf("{", markerIndex);
  if (start === -1) return "";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return value.slice(start, index + 1);
    }
  }

  return "";
}

function readMeta(html: string, name: string) {
  const escapedName = escapeRegExp(name);
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapedName}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = cleanText(match?.[1]);
    if (value) return value;
  }

  return "";
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return decodeHtml(value)
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function lastThumbnail(thumbnails?: Array<{ url?: string }>) {
  return thumbnails?.filter((thumbnail) => thumbnail.url).at(-1)?.url;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}h ${minutes}m ${remainingSeconds}s`
    : `${minutes}m ${remainingSeconds}s`;
}

function sanitizeVideoId(value: string | undefined | null) {
  const match = value?.match(/^[A-Za-z0-9_-]{11}/);
  return match?.[0] ?? null;
}

function browserHeaders() {
  return {
    Accept: "text/html,application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
