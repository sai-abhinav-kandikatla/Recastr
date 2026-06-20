import type { Platform, SourceType } from "@/lib/types";

export const CONTENT_CATEGORIES = [
  "Curiosity",
  "Educational",
  "Story",
  "Contrarian",
  "Framework",
  "Mistake",
  "Data",
  "Quote",
  "Actionable",
  "Opinion",
  "Listicle",
  "Comparison",
] as const;

export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export const INSIGHT_KINDS = [
  "topic",
  "story",
  "quote",
  "statistic",
  "lesson",
  "mistake",
  "contrarian_opinion",
  "interesting_moment",
  "emotional_moment",
  "curiosity_hook",
  "actionable_advice",
  "example",
  "framework",
  "analogy",
  "surprising_fact",
] as const;

export type InsightKind = (typeof INSIGHT_KINDS)[number];

export type TranscriptSourceType = SourceType | "DOCUMENT";

export type TranscriptExtractionMethod =
  | "cache"
  | "page_captions"
  | "youtube_transcript_api"
  | "yt_dlp_subtitles"
  | "whisper"
  | "html_article"
  | "document_text"
  | "raw_text";

export type TranscriptSegment = {
  id: string;
  text: string;
  startMs?: number;
  endMs?: number;
  speaker?: string;
};

export type TranscriptExtractionResult = {
  sourceType: TranscriptSourceType;
  sourceUrl?: string;
  title: string;
  transcript: string;
  segments: TranscriptSegment[];
  method: TranscriptExtractionMethod;
  cached: boolean;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
  wordCount: number;
  warnings: string[];
};

export type TranscriptInput = {
  sourceType: TranscriptSourceType;
  url?: string;
  title?: string;
  text?: string;
  filePath?: string;
  fileName?: string;
  userId?: string;
};

export type TranscriptChunk = {
  id: string;
  index: number;
  text: string;
  wordCount: number;
  startSegment: number;
  endSegment: number;
  speakers: string[];
  topicHint: string;
  continuity: {
    before?: string;
    after?: string;
  };
};

export type ExtractedInsight = {
  id: string;
  kind: InsightKind;
  category: ContentCategory;
  title: string;
  text: string;
  evidence: string;
  score: number;
  sourceChunkIds: string[];
  speaker?: string;
  timestampMs?: number;
};

export type KnowledgeGraphNode = {
  id: string;
  label: string;
  kind: "topic" | "insight" | "story" | "quote" | "lesson" | "hook" | "framework";
  category?: ContentCategory;
  weight: number;
  insightIds: string[];
};

export type KnowledgeGraphEdge = {
  from: string;
  to: string;
  relation:
    | "supports"
    | "contrasts"
    | "explains"
    | "uses_example"
    | "contains_quote"
    | "leads_to"
    | "same_theme";
  weight: number;
};

export type KnowledgeGraph = {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
};

export type QualityScores = {
  originality: number;
  clarity: number;
  humanLikeness: number;
  usefulness: number;
  readability: number;
  overall: number;
  reasons: string[];
};

export type ContentDraft = {
  id: string;
  platform: Platform;
  category: ContentCategory;
  contentType: string;
  body: string;
  originalBody: string;
  tone: string;
  quality: QualityScores;
  sourceInsightIds: string[];
  reviewerNotes: string[];
};

export type ProjectMemory = {
  previousOutputs: string[];
  usedTopics: string[];
  usedHookStyles: string[];
  writingStylePreferences: string[];
  bannedPhrases: string[];
};

export type ContentIntelligenceReport = {
  version: "content-intelligence-v1";
  transcript: {
    method: TranscriptExtractionMethod;
    cached: boolean;
    wordCount: number;
    chunkCount: number;
    warnings: string[];
  };
  topics: string[];
  stories: string[];
  quotes: string[];
  statistics: string[];
  lessons: string[];
  mistakes: string[];
  contrarianOpinions: string[];
  interestingMoments: string[];
  emotionalMoments: string[];
  curiosityHooks: string[];
  actionableAdvice: string[];
  examples: string[];
  frameworks: string[];
  analogies: string[];
  surprisingFacts: string[];
  insights: ExtractedInsight[];
  graph: KnowledgeGraph;
  categories: Record<ContentCategory, string[]>;
  memory: ProjectMemory;
  quality: {
    averageScore: number;
    rejectedDrafts: number;
  };
};
