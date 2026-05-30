import type { Platform } from "@/lib/types";

export type PreviewPlatform = Extract<
  Platform,
  "TWITTER" | "LINKEDIN" | "INSTAGRAM" | "FACEBOOK" | "THREADS" | "COMMUNITY"
>;

export type PreviewDevice = "iphone" | "android" | "desktop";

export type PreviewContent = {
  primaryText: string;
  thread: string[];
  pollQuestion: string;
  pollOptions: string[];
  hashtags: string[];
  hook: string;
  mediaType: "image" | "carousel" | "video" | "text" | "poll";
  carouselSlides: string[];
};

export function parsePreviewContent(platform: PreviewPlatform, draft: string): PreviewContent {
  const cleanDraft = draft.trim();
  const fallbackLines = cleanDraft.split("\n").map((line) => line.trim()).filter(Boolean);

  if (platform === "TWITTER") {
    const thread = extractSection(cleanDraft, "Thread")
      .split(/\n{2,}|\n(?=\d+\.\s)/)
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
    return {
      primaryText: extractSection(cleanDraft, "Single tweet") || thread[0] || fallbackLines[0] || cleanDraft,
      thread: thread.length ? thread : fallbackLines,
      pollQuestion: "",
      pollOptions: [],
      hashtags: [],
      hook: fallbackLines[0] || cleanDraft,
      mediaType: "text",
      carouselSlides: [],
    };
  }

  if (platform === "LINKEDIN") {
    const shortPost = extractSection(cleanDraft, "Short post");
    const longPost = extractSection(cleanDraft, "Long post");
    const poll = extractSection(cleanDraft, "Poll");
    const pollData = parsePoll(poll);
    return {
      primaryText: shortPost || longPost || cleanDraft,
      thread: [],
      pollQuestion: pollData.question,
      pollOptions: pollData.options,
      hashtags: [],
      hook: firstSentence(shortPost || longPost || cleanDraft),
      mediaType: pollData.options.length ? "poll" : "text",
      carouselSlides: [],
    };
  }

  if (platform === "INSTAGRAM") {
    const caption = extractSection(cleanDraft, "Caption") || cleanDraft;
    const hashtagText = extractSection(cleanDraft, "Hashtags");
    const reelScript = extractSection(cleanDraft, "Reel script");
    const story = extractSection(cleanDraft, "Story sequence");
    const slides = story
      .split(/\n(?=Slide\s+\d+)/i)
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      primaryText: caption,
      thread: [],
      pollQuestion: "",
      pollOptions: [],
      hashtags: hashtagText.match(/#[\w]+/g)?.slice(0, 14) ?? [],
      hook: extractLineValue(reelScript, "Hook") || firstSentence(caption),
      mediaType: slides.length > 1 ? "carousel" : "image",
      carouselSlides: slides.length ? slides : fallbackLines.slice(0, 5),
    };
  }

  if (platform === "FACEBOOK") {
    const poll = extractSection(cleanDraft, "Poll");
    const pollData = parsePoll(poll || cleanDraft);
    return {
      primaryText: extractSection(cleanDraft, "Short post") || cleanDraft,
      thread: [],
      pollQuestion: pollData.question,
      pollOptions: pollData.options,
      hashtags: cleanDraft.match(/#[\w]+/g)?.slice(0, 8) ?? [],
      hook: firstSentence(cleanDraft),
      mediaType: pollData.options.length ? "poll" : "image",
      carouselSlides: fallbackLines.slice(0, 4),
    };
  }

  if (platform === "THREADS") {
    const thread = fallbackLines.length > 1 ? fallbackLines : splitIntoThread(cleanDraft);
    return {
      primaryText: thread[0] || cleanDraft,
      thread,
      pollQuestion: "",
      pollOptions: [],
      hashtags: cleanDraft.match(/#[\w]+/g)?.slice(0, 6) ?? [],
      hook: firstSentence(cleanDraft),
      mediaType: "text",
      carouselSlides: [],
    };
  }

  const communityPost = extractSection(cleanDraft, "Community post") || cleanDraft;
  const poll = extractSection(cleanDraft, "Poll");
  const pollData = parsePoll(poll || cleanDraft);
  return {
    primaryText: communityPost,
    thread: [],
    pollQuestion: pollData.question,
    pollOptions: pollData.options,
    hashtags: [],
    hook: firstSentence(communityPost),
    mediaType: pollData.options.length ? "poll" : "text",
    carouselSlides: [],
  };
}

function extractSection(draft: string, sectionName: string) {
  const sectionNames = [
    "Single tweet",
    "Thread",
    "Quote tweet angle",
    "Short post",
    "Long post",
    "Poll",
    "Reel script",
    "Caption",
    "Hashtags",
    "Story sequence",
    "Community post",
    "Facebook post",
    "Threads post",
  ];
  const pattern = new RegExp(
    `(?:^|\\n)${escapeRegExp(sectionName)}\\n([\\s\\S]*?)(?=\\n(?:${sectionNames
      .filter((name) => name !== sectionName)
      .map(escapeRegExp)
      .join("|")})\\n|$)`,
    "i",
  );
  return pattern.exec(draft)?.[1]?.trim() ?? "";
}

function extractLineValue(text: string, label: string) {
  return (
    text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`))
      ?.replace(new RegExp(`^${escapeRegExp(label)}:\\s*`, "i"), "")
      .trim() ?? ""
  );
}

function firstSentence(text: string) {
  return text.split(/(?<=[.!?])\s+/)[0]?.trim() || text.trim();
}

function splitIntoThread(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) return [text];
  return sentences.slice(0, 6);
}

function parsePoll(text: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const options = lines
    .filter((line) => /^([A-D]|\d+)[).]\s+/i.test(line) || line.startsWith("-"))
    .map((line) => line.replace(/^([A-D]|\d+)[).]\s+/i, "").replace(/^-\s*/, ""))
    .slice(0, 4);
  const question = lines.find((line) => !/^([A-D]|\d+)[).]\s+/i.test(line) && !line.startsWith("-")) ?? "";
  return { question, options };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
