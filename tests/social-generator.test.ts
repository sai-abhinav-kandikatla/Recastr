import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateAIText: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  generateAIText: mocks.generateAIText,
}));

import { generateV1SocialOutputs } from "../lib/v1/social-generator";

describe("generateV1SocialOutputs", () => {
  beforeEach(() => {
    mocks.generateAIText.mockReset();
  });

  it("generates every selected platform in one provider request", async () => {
    mocks.generateAIText.mockResolvedValue(JSON.stringify({
      posts: {
        LINKEDIN: ["LinkedIn draft one", "LinkedIn draft two"],
        TWITTER: ["Tweet one", "Tweet two", "Tweet three"],
      },
    }));

    const outputs = await generateV1SocialOutputs({
      projectId: "one-pass-project",
      sourceDocument: "A grounded source document with enough detail for social posts.",
      platforms: ["LINKEDIN", "TWITTER"],
      tone: "Professional",
      transcriptAvailable: true,
    });

    expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
    expect(mocks.generateAIText.mock.calls[0][0].prompt).toContain("- LINKEDIN: LinkedIn");
    expect(mocks.generateAIText.mock.calls[0][0].prompt).toContain("- TWITTER: Twitter/X");
    expect(outputs).toHaveLength(5);
    expect(outputs.filter((output) => output.platform === "LINKEDIN")).toHaveLength(2);
    expect(outputs.filter((output) => output.platform === "TWITTER")).toHaveLength(3);
  });
});
