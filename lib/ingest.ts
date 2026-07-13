import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma/client";
import { getStoredProject, saveStoredProject } from "@/lib/projects/store";
import { extractYouTubeSource, extractYouTubeVideoId } from "@/lib/v1/youtube-source";
import type { Project, SourceSummary } from "@/lib/types";

export class IngestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IngestError";
    this.code = code;
  }
}

export { extractYouTubeVideoId };

export async function ingestYoutubeTranscriptOnly(url: string, userId: string): Promise<Project> {
  return ingestYoutube(url, userId);
}

export async function ingestYoutube(url: string, userId: string): Promise<Project> {
  if (process.env.RECASTR_DEMO_MODE === "true") {
    return getStoredProject("demo-ai-youtube")!;
  }

  try {
    const source = await extractYouTubeSource(url);
    const project = buildProject({
      id: `youtube-${hash(`${source.url}:${userId}`).slice(0, 10)}-${userId}`,
      userId,
      title: source.title,
      sourceType: "YOUTUBE",
      sourceUrl: source.url,
      thumbnailUrl: source.thumbnailUrl,
      sourceText: source.sourceDocument,
      transcript: source.sourceDocument,
      duration: source.durationSeconds,
      wordCount: countWords(source.transcript || source.sourceDocument),
      summary: {
        tldr:
          source.transcriptStatus === "available"
            ? `Transcript found (${countWords(source.transcript)} words). Source is ready for V1 generation.`
            : "Transcript unavailable. Generation will use metadata and description only.",
        takeaways: [
          `Channel: ${source.channelName}`,
          `Published: ${source.publishedDate}`,
          source.description || "No description was available.",
        ],
        hooks: [],
        detectedTone: "educational",
        topics: source.tags.length > 0 ? source.tags.slice(0, 5) : ["youtube", "source repurposing"],
        targetAudience: "Creators and their audience",
      },
    });
    await persistProject(project, "youtube");
    saveStoredProject(project);
    return project;
  } catch (error) {
    if (error instanceof Error && /Invalid YouTube URL/i.test(error.message)) {
      throw new IngestError("INVALID_URL", error.message);
    }
    throw error;
  }
}

export async function ingestBlog(url: string, userId: string = "local-user"): Promise<Project> {
  if (process.env.RECASTR_DEMO_MODE === "true") {
    return getStoredProject("demo-marketing-blog")!;
  }

  const source = await extractBlogSource(url);
  const text = [
    "ARTICLE INFORMATION",
    "",
    "Title:",
    source.title,
    "",
    "Description:",
    source.description || "No description available.",
    "",
    "Body:",
    source.body || source.description || "No article body could be extracted.",
    "",
    "END OF SOURCE",
  ].join("\n");

  const project = buildProject({
    id: `blog-${hash(`${url}:${userId}`).slice(0, 10)}-${userId}`,
    userId,
    title: source.title,
    sourceType: "BLOG",
    sourceUrl: url,
    sourceText: text,
    transcript: text,
    wordCount: countWords(text),
    summary: {
      tldr: "Article source is ready for V1 generation.",
      takeaways: [source.description || "Article metadata extracted."],
      hooks: [],
      detectedTone: "educational",
      topics: ["article", "source repurposing"],
      targetAudience: "Creators and their audience",
    },
  });

  await persistProject(project, "blog");
  saveStoredProject(project);
  return project;
}

export async function ingestPodcast(fileName = "podcast-upload.mp3"): Promise<Project> {
  if (process.env.RECASTR_DEMO_MODE === "true") {
    return getStoredProject("demo-founder-podcast")!;
  }

  return {
    ...getStoredProject("demo-founder-podcast")!,
    id: `podcast-${hash(fileName).slice(0, 10)}`,
    title: fileName.replace(/\.[^.]+$/, ""),
    createdAt: new Date().toISOString(),
  };
}

export function hash(value: string | Buffer) {
  return crypto.createHash("md5").update(value).digest("hex");
}

function buildProject({
  id,
  userId,
  title,
  sourceType,
  sourceUrl,
  thumbnailUrl,
  sourceText,
  transcript,
  duration,
  wordCount,
  summary,
}: {
  id: string;
  userId: string;
  title: string;
  sourceType: Project["sourceType"];
  sourceUrl: string;
  thumbnailUrl?: string;
  sourceText: string;
  transcript: string;
  duration?: number;
  wordCount: number;
  summary: SourceSummary;
}): Project {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    title,
    sourceType,
    sourceUrl,
    thumbnailUrl,
    sourceText,
    transcript,
    duration,
    wordCount,
    summary,
    hooks: [],
    contents: [],
    outputs: [],
    createdAt: now,
    updatedAt: now,
    status: "DRAFT",
  };
}

async function persistProject(project: Project, dbSourceType: string) {
  await prisma.project.upsert({
    where: { id: project.id },
    update: {
      title: project.title,
      sourceUrl: project.sourceUrl,
      sourceText: project.sourceText,
      sourceType: dbSourceType,
      thumbnailUrl: project.thumbnailUrl,
      transcript: project.transcript,
      summary: project.summary as Prisma.InputJsonValue,
      duration: project.duration,
      wordCount: project.wordCount,
      hooks: { deleteMany: {} },
      contents: { deleteMany: {} },
    },
    create: {
      id: project.id,
      userId: project.userId ?? "local-user",
      title: project.title,
      sourceUrl: project.sourceUrl,
      sourceText: project.sourceText,
      sourceType: dbSourceType,
      thumbnailUrl: project.thumbnailUrl,
      transcript: project.transcript,
      summary: project.summary as Prisma.InputJsonValue,
      duration: project.duration,
      wordCount: project.wordCount,
    },
  });
}

async function extractBlogSource(url: string) {
  const response = await axios.get<string>(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const $ = cheerio.load(response.data);
  $("script, style, nav, footer, aside").remove();

  const title =
    cleanText($("meta[property='og:title']").attr("content")) ||
    cleanText($("title").text()) ||
    "Imported article";
  const description =
    cleanText($("meta[name='description']").attr("content")) ||
    cleanText($("meta[property='og:description']").attr("content"));
  const body = sanitizeHtml($("article").text() || $("main").text() || $("body").text(), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 12_000)
    .join(" ");

  return { title, description, body };
}

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}
