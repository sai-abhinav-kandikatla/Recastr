import { describe, expect, it } from "vitest";
import { buildGenerationSource } from "../lib/v1/generation-source";
import { buildSourceDocument } from "../lib/v1/youtube-source";
import type { Project } from "../lib/types";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    title: "A useful video title",
    sourceType: "YOUTUBE",
    transcript: "",
    summary: {
      tldr: "A metadata-only summary of the source.",
      takeaways: ["Channel: Example Creator", "Published: 2026-07-11"],
      hooks: [],
      detectedTone: "educational",
      topics: ["example"],
      targetAudience: "Creators",
    },
    hooks: [],
    contents: [],
    outputs: [],
    createdAt: "2026-07-11T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:00.000Z",
    status: "DRAFT",
    ...overrides,
  };
}

describe("buildGenerationSource", () => {
  it("continues with metadata when no transcript or source document exists", () => {
    const result = buildGenerationSource(project({ sourceUrl: "https://youtube.com/watch?v=abcdefghijk" }));

    expect(result.sourceMode).toBe("metadata");
    expect(result.transcriptAvailable).toBe(false);
    expect(result.sourceDocument).toContain("A useful video title");
    expect(result.sourceDocument).toContain("A metadata-only summary");
    expect(result.sourceDocument).not.toContain("Transcript unavailable");
  });

  it("recognizes the metadata-only source document emitted by YouTube ingest", () => {
    const result = buildGenerationSource(project({
      sourceText: "Title:\nGuinness World Records survey\n\nDescription:\nNikhil reviews unusual record attempts and explains why the funniest examples became memorable.\n\nTranscript:\nTranscript unavailable. Use metadata.",
    }));

    expect(result.sourceMode).toBe("metadata");
    expect(result.transcriptAvailable).toBe(false);
    expect(result.sourceDocument).not.toContain("Transcript unavailable");
  });

  it("uses an available transcript as grounded source", () => {
    const result = buildGenerationSource(project({
      transcript: "Nikhil compares unusual Guinness World Records and explains how surprising attempts become memorable stories for viewers.",
    }));

    expect(result.sourceMode).toBe("transcript");
    expect(result.transcriptAvailable).toBe(true);
  });

  it("returns a structured error when the source has no meaningful context", () => {
    expect(() => buildGenerationSource(project({
      title: "Untitled",
      transcript: "Unknown source.",
      summary: {
        tldr: "Source ready for generation.",
        takeaways: [],
        hooks: [],
        detectedTone: "educational",
        topics: [],
        targetAudience: "Creators",
      },
    }))).toThrowError(expect.objectContaining({ code: "INSUFFICIENT_SOURCE_CONTEXT", status: 422 }));
  });

  it("keeps YouTube tags in metadata-only context without adding transcript templates", () => {
    const sourceDocument = buildSourceDocument({
      videoId: "abcdefghijk",
      url: "https://youtube.com/watch?v=abcdefghijk",
      title: "Unusual Guinness World Records",
      description: "Nikhil reviews surprising record attempts and the stories behind them.",
      channelName: "Nikhil",
      tags: ["Guinness World Records", "survey", "comedy"],
      publishedDate: "2026-07-11",
      durationSeconds: 540,
      transcript: "",
      transcriptStatus: "missing",
    });

    expect(sourceDocument).toContain("Tags:\nGuinness World Records, survey, comedy");
    expect(sourceDocument).not.toContain("Transcript unavailable");
  });
});
