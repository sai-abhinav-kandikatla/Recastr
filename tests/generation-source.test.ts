import { describe, expect, it } from "vitest";
import { buildGenerationSource } from "../lib/v1/generation-source";
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
    expect(result.sourceDocument).toContain("Transcript unavailable");
  });

  it("recognizes the metadata-only source document emitted by YouTube ingest", () => {
    const result = buildGenerationSource(project({
      sourceText: "Title:\nMetadata title\n\nDescription:\nUseful details\n\nTranscript:\nTranscript unavailable. Use metadata.",
    }));

    expect(result.sourceMode).toBe("metadata");
    expect(result.transcriptAvailable).toBe(false);
  });

  it("uses an available transcript as grounded source", () => {
    const result = buildGenerationSource(project({ transcript: "A full transcript with grounded source facts." }));

    expect(result.sourceMode).toBe("transcript");
    expect(result.transcriptAvailable).toBe(true);
  });
});
