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
    `The strangest records are often the easiest stories to remember.

Nikhil's Guinness World Records survey landed as a useful reminder about attention: an unusual attempt gives an audience an immediate question, visible stakes, and a result worth retelling. A broad claim cannot create that same tension.

That changes how I think about packaging an idea. The lesson is not to make every subject louder. It is to make the challenge more concrete.

1. Start with an attempt people can picture immediately.
2. Make the difficulty clear before revealing the result.
3. Keep the surprising detail close to the opening.
4. Give people a reason to repeat the story in one sentence.

Specificity does more than explain an idea. It gives the audience something they can carry into another conversation. That is why a peculiar Guinness attempt can outlive a polished but generic message.

What concrete detail makes your current story worth retelling?

#Storytelling #ContentStrategy #AudienceGrowth`,
    `A useful content lesson can hide inside a very unusual challenge.

Looking through Nikhil's survey of Guinness World Records changed the question I ask before publishing. I used to focus on whether an idea sounded impressive. Now I care more about whether someone can picture the attempt, understand the stakes, and anticipate the result.

That sequence is what makes a record memorable:

1. The premise is simple enough to explain quickly.
2. The attempt creates tension without extra context.
3. The outcome gives the audience a clean payoff.
4. The unusual detail makes the story easy to repeat.

The practical takeaway is surprisingly strict: if the audience cannot describe the challenge after one read, the framing is still too abstract. Replace claims with a visible action. Replace hype with a measurable obstacle. Replace a broad topic with the one moment that carries the tension.

I am taking that test into my next post. Could a reader retell the core idea without reopening it?

#CreativeWriting #ContentMarketing #Communication`,
  ],
  TWITTER: [
    "TWEET_1: The strangest Guinness records are memorable because the challenge is instantly clear.\n---\nTWEET_2: 1/ Nikhil's survey starts with unusual attempts, not broad claims.\n---\nTWEET_3: 2/ A visible challenge creates tension before the result arrives.\n---\nTWEET_4: 3/ Specific stakes give viewers a story they can repeat.\n---\nTWEET_5: 4/ The lesson for creators: make the attempt concrete.\n---\nTWEET_6: Save this before framing your next story.",
    "TWEET_1: One peculiar Guinness attempt can beat ten polished claims for attention.\n---\nTWEET_2: 1/ The premise works because viewers understand it immediately.\n---\nTWEET_3: 2/ The difficulty supplies a natural curiosity gap.\n---\nTWEET_4: 3/ The result becomes proof instead of promotion.\n---\nTWEET_5: 4/ Nikhil's records survey turns specificity into the hook.\n---\nTWEET_6: Watch for the detail you will want to retell.",
    "TWEET_1: Guinness figured out a durable story formula: clear attempt, visible stakes, memorable result.\n---\nTWEET_2: 1/ A simple challenge needs almost no explanation.\n---\nTWEET_3: 2/ An unusual constraint makes the outcome matter.\n---\nTWEET_4: 3/ Nikhil's survey keeps the record attempts concrete.\n---\nTWEET_5: 4/ Concrete stories travel further than abstract advice.\n---\nTWEET_6: Use that formula in your next opening.",
  ],
};

const repairedLinkedInPosts = [
  `A record attempt becomes compelling before anyone knows the result.

That was the strongest idea I took from Nikhil's survey of unusual Guinness World Records. The audience does not need a long explanation because the attempt itself creates the question: can this person actually do it?

There is a practical framework hiding in that tension:

1. Name one action the audience can visualize.
2. Expose the constraint that makes it difficult.
3. Delay the result long enough for curiosity to form.
4. Let the outcome provide the proof.

I often see creators reverse this order. They begin with a conclusion, add context, and hope the reader stays for the example. A record story begins with motion. The meaning arrives after attention has already been earned.

My next opening will start closer to the attempt and further away from the explanation. That small shift can turn an abstract lesson into a scene someone remembers.

Which part of your idea could become a visible challenge?

#Writing #CreatorEconomy #StoryDesign`,
  `Surprise works best when the audience knows exactly what is at stake.

Nikhil's Guinness records survey made me reconsider the usual advice to begin with a big promise. The memorable attempts do something more disciplined: they establish a precise challenge and allow the result to carry the drama.

That offers four useful choices for anyone communicating an idea:

1. Trade a broad topic for one observable action.
2. Replace exaggerated language with a real constraint.
3. Give the audience enough information to predict an outcome.
4. Reveal the detail that makes the prediction wrong or remarkable.

The surprising part is how little ornament the structure needs. When a challenge is concrete, curiosity appears naturally. When the stakes are vague, even polished writing feels like promotion.

I want to use that distinction more deliberately: explain less at the opening, choose a sharper moment, and trust the evidence to create interest.

What is the smallest specific moment that proves your biggest point?

#BrandStorytelling #Marketing #CreativeStrategy`,
];

function generatedResponseForPrompt(
  prompt: string,
  posts: Partial<Record<"LINKEDIN" | "TWITTER", string[]>> = validPosts,
) {
  const platform = prompt.includes("TWITTER/X -") ? "TWITTER" : "LINKEDIN";
  const draftNumber = Number(prompt.match(/DRAFT ASSIGNMENT: Write only draft_(\d+)/)?.[1] ?? "1");
  return JSON.stringify({
    posts: {
      [platform]: { draft_1: posts[platform]?.[draftNumber - 1] ?? "" },
    },
  });
}

describe("generateV1SocialOutputs", () => {
  beforeEach(() => {
    mocks.generateAIText.mockReset();
  });

  it("generates every selected platform with an independent platform brief", async () => {
    mocks.generateAIText.mockImplementation(({ prompt }) => generatedResponseForPrompt(prompt));

    const outputs = await generateV1SocialOutputs({
      projectId: "one-pass-project",
      sourceDocument,
      platforms: ["LINKEDIN", "TWITTER"],
      tone: "Professional",
      transcriptAvailable: true,
    });

    expect(mocks.generateAIText).toHaveBeenCalledTimes(5);
    expect(mocks.generateAIText.mock.calls[0][0].model).toBe("meta/llama-3.1-8b-instruct");
    expect(mocks.generateAIText.mock.calls.some(([options]) => options.prompt.includes("LINKEDIN - write only draft_"))).toBe(true);
    expect(mocks.generateAIText.mock.calls.some(([options]) => options.prompt.includes("TWITTER/X - write only draft_"))).toBe(true);
    expect(mocks.generateAIText.mock.calls[0][0].prompt).toContain("What is the most shareable moment or insight here?");
    expect(mocks.generateAIText.mock.calls[0][0].prompt).not.toContain("What is this actually about?");
    expect(outputs).toHaveLength(5);
    expect(outputs.filter((output) => output.platform === "LINKEDIN")).toHaveLength(2);
    expect(outputs.filter((output) => output.platform === "TWITTER")).toHaveLength(3);
  });

  it("uses metadata-only context for LLM generation without fallback text", async () => {
    mocks.generateAIText.mockImplementation(({ prompt }) => generatedResponseForPrompt(prompt));

    const outputs = await generateV1SocialOutputs({
      projectId: "metadata-project",
      sourceDocument: `${sourceDocument}\nTranscript: Transcript unavailable. Use only the metadata above.`,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: false,
    });

    expect(mocks.generateAIText).toHaveBeenCalledTimes(2);
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

  it("returns insufficient context before asking a short source for too many drafts", async () => {
    await expect(generateV1SocialOutputs({
      projectId: "short-source-project",
      sourceDocument: "Elephants have really, really long trunks and that is cool to notice.",
      platforms: ["LINKEDIN", "TWITTER", "INSTAGRAM", "FACEBOOK", "THREADS", "COMMUNITY"],
      tone: "Professional",
      transcriptAvailable: true,
    })).rejects.toMatchObject({ code: "INSUFFICIENT_SOURCE_CONTEXT", status: 422 });
    expect(mocks.generateAIText).not.toHaveBeenCalled();
  });

  it("uses a bounded LLM repair when the first batch fails quality checks", async () => {
    mocks.generateAIText.mockImplementation(({ prompt }) => {
      const draftNumber = Number(prompt.match(/DRAFT ASSIGNMENT: Write only draft_(\d+)/)?.[1] ?? "1");
      const isRepair = prompt.includes("QUALITY CHECKS FAILED");
      const content = draftNumber === 1 && !isRepair
        ? "Too short"
        : repairedLinkedInPosts[draftNumber - 1];
      return JSON.stringify({ posts: { LINKEDIN: { draft_1: content } } });
    });

    const outputs = await generateV1SocialOutputs({
      projectId: "repair-project",
      sourceDocument,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: false,
    });

    expect(mocks.generateAIText).toHaveBeenCalledTimes(3);
    expect(outputs.map((output) => output.content)).toEqual(repairedLinkedInPosts);
  });

  it("rejects leaked internal instructions before any output is emitted", async () => {
    mocks.generateAIText.mockResolvedValue(JSON.stringify({
      posts: {
        LINKEDIN: {
          draft_1: "The transcript was unavailable, so review the source details and rewrite this draft for LinkedIn.",
        },
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
    expect(mocks.generateAIText).toHaveBeenCalledTimes(5);
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
    expect(mocks.generateAIText).toHaveBeenCalledTimes(6);
    expect(onOutput).not.toHaveBeenCalled();
  });

  it("rejects video-description copy before persistence", async () => {
    mocks.generateAIText.mockImplementation(({ prompt }) => {
      const draftNumber = Number(prompt.match(/DRAFT ASSIGNMENT: Write only draft_(\d+)/)?.[1] ?? "1");
      const content = draftNumber === 1
        ? validPosts.LINKEDIN[0]
        : validPosts.LINKEDIN[1].replace(
            "A useful content lesson can hide inside a very unusual challenge.",
            "A Telugu video showcases a blindfolded guesser defying age-based assumptions.",
          );
      return JSON.stringify({ posts: { LINKEDIN: { draft_1: content } } });
    });

    await expect(generateV1SocialOutputs({
      projectId: "description-copy-project",
      sourceDocument,
      platforms: ["LINKEDIN"],
      tone: "Professional",
      transcriptAvailable: true,
    })).rejects.toMatchObject({ code: "INVALID_GENERATED_CONTENT" });
    expect(mocks.generateAIText).toHaveBeenCalledTimes(6);
  });
});
