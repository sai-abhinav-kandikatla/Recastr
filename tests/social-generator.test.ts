import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateAIText: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  generateAIText: mocks.generateAIText,
}));

import { generateV1SocialOutputs } from "../lib/v1/social-generator";

const sourceDocument = `Title: Guinness World Records survey
Channel: Nikhil
Description: Nikhil reviews unusual Guinness World Records and explains why surprising record attempts become memorable stories for viewers.`;

const validPosts = {
  LINKEDIN: [
    "Guinness World Records endure because unusual attempts turn simple ideas into memorable stories. Nikhil's survey shows how surprise can make familiar formats feel fresh.",
    "Nikhil's look at unusual Guinness records offers a useful content lesson: a specific, surprising attempt is easier to remember than a generic claim. Concrete stories earn attention.",
  ],
  TWITTER: [
    "The strangest Guinness World Records are memorable for one reason: each attempt turns a simple idea into a story worth retelling.",
    "Nikhil's Guinness records survey proves that specificity beats hype. One unusual attempt can hold attention better than ten generic claims.",
    "Surprising record attempts make strong stories because viewers instantly understand the challenge, the stakes, and the result. Guinness figured that out early.",
  ],
};

const repairedLinkedInPosts = [
  "Nikhil turns unusual Guinness record attempts into a lesson about attention: audiences remember a concrete challenge when its stakes are immediately clear.",
  "A surprising Guinness record works like a strong business story. The attempt creates tension, the result creates proof, and Nikhil's survey gives viewers a reason to retell it.",
];

describe("generateV1SocialOutputs", () => {
  beforeEach(() => {
    mocks.generateAIText.mockReset();
  });

  it("generates every selected platform in one provider request", async () => {
    mocks.generateAIText.mockResolvedValue(JSON.stringify({ posts: validPosts }));

    const outputs = await generateV1SocialOutputs({
      projectId: "one-pass-project",
      sourceDocument,
      platforms: ["LINKEDIN", "TWITTER"],
      tone: "Professional",
      transcriptAvailable: true,
    });

    expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
    expect(mocks.generateAIText.mock.calls[0][0].model).toBe("meta/llama-3.1-8b-instruct");
    expect(mocks.generateAIText.mock.calls[0][0].prompt).toContain("- LINKEDIN: LinkedIn");
    expect(mocks.generateAIText.mock.calls[0][0].prompt).toContain("- TWITTER: Twitter/X");
    expect(outputs).toHaveLength(5);
    expect(outputs.filter((output) => output.platform === "LINKEDIN")).toHaveLength(2);
    expect(outputs.filter((output) => output.platform === "TWITTER")).toHaveLength(3);
  });

  it("uses metadata-only context for LLM generation without fallback text", async () => {
    mocks.generateAIText.mockResolvedValue(JSON.stringify({ posts: { LINKEDIN: validPosts.LINKEDIN } }));

    const outputs = await generateV1SocialOutputs({
      projectId: "metadata-project",
      sourceDocument: `${sourceDocument}\nTranscript: Transcript unavailable. Use only the metadata above.`,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: false,
    });

    expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
    expect(mocks.generateAIText.mock.calls[0][0].prompt).not.toContain("Transcript unavailable");
    expect(outputs).toHaveLength(2);
    expect(outputs.every((output) => String(output.content).includes("Guinness"))).toBe(true);
  });

  it("propagates provider failures without creating fallback drafts", async () => {
    mocks.generateAIText.mockRejectedValue(new Error("Request timed out"));
    const onOutput = vi.fn();

    await expect(generateV1SocialOutputs({
      projectId: "provider-failure",
      sourceDocument,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: false,
      onOutput,
    })).rejects.toThrow("Request timed out");
    expect(onOutput).not.toHaveBeenCalled();
  });

  it("uses one LLM repair pass when the first batch fails quality checks", async () => {
    mocks.generateAIText
      .mockResolvedValueOnce(JSON.stringify({
        posts: { LINKEDIN: [validPosts.LINKEDIN[0], validPosts.LINKEDIN[0]] },
      }))
      .mockResolvedValueOnce(JSON.stringify({ posts: { LINKEDIN: repairedLinkedInPosts } }));

    const outputs = await generateV1SocialOutputs({
      projectId: "repair-project",
      sourceDocument,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: false,
    });

    expect(mocks.generateAIText).toHaveBeenCalledTimes(2);
    expect(outputs.map((output) => output.content)).toEqual(repairedLinkedInPosts);
  });

  it("rejects leaked internal instructions before any output is emitted", async () => {
    mocks.generateAIText.mockResolvedValue(JSON.stringify({
      posts: {
        LINKEDIN: [
          validPosts.LINKEDIN[0],
          "The transcript was unavailable, so review the source details and rewrite this draft for LinkedIn.",
        ],
      },
    }));
    const onOutput = vi.fn();

    await expect(generateV1SocialOutputs({
      projectId: "leak-project",
      sourceDocument,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: false,
      onOutput,
    })).rejects.toMatchObject({ code: "INVALID_GENERATED_CONTENT" });
    expect(mocks.generateAIText).toHaveBeenCalledTimes(2);
    expect(onOutput).not.toHaveBeenCalled();
  });

  it("rejects repeated drafts before any output is emitted", async () => {
    mocks.generateAIText.mockResolvedValue(JSON.stringify({
      posts: { LINKEDIN: [validPosts.LINKEDIN[0], validPosts.LINKEDIN[0]] },
    }));
    const onOutput = vi.fn();

    await expect(generateV1SocialOutputs({
      projectId: "duplicate-project",
      sourceDocument,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: true,
      onOutput,
    })).rejects.toMatchObject({ code: "INVALID_GENERATED_CONTENT" });
    expect(mocks.generateAIText).toHaveBeenCalledTimes(2);
    expect(onOutput).not.toHaveBeenCalled();
  });
});
