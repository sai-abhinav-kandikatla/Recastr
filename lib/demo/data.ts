import type {
  BrandVoice,
  ContentPiece,
  Platform,
  Project,
  ScheduledPost,
  SocialOutput,
  ViralHook,
} from "@/lib/types";

const now = Date.UTC(2026, 4, 28, 9, 30, 0);

export const defaultSummary = {
  tldr:
    "One long-form source can become a complete content campaign when the best hooks are extracted first. Recastr identifies emotional moments, ranks opening lines, and turns source material into platform-native posts.",
  takeaways: [
    "Start with source signal before choosing formats.",
    "Rank hooks by emotional tension and specificity.",
    "Rewrite every idea for platform culture.",
    "Keep editing and approval close to generation.",
    "Export the strongest pieces as a campaign pack.",
  ],
  hooks: [
    "Your next month of content is already inside one source.",
    "Most creators do not need more ideas. They need better extraction.",
    "The strongest hook is usually hiding in the uncomfortable moment.",
    "Repurposing is translation, not copying.",
    "A transcript becomes useful only after the signal is ranked.",
    "One story can become a thread, a post, a Reel, and a caption.",
    "AI content works when it preserves the human tension.",
    "The content calendar should come after the insight.",
    "The best posts are found before they are written.",
    "Great repurposing feels like editing, not automation.",
  ],
  detectedTone: "educational" as const,
  topics: ["content repurposing", "viral hooks", "creator workflow"],
  targetAudience: "Founders, creators, podcasters, YouTubers, and agencies",
};

const transcripts = {
  podcast: `The host opens with a confession: six months before the business became stable, she almost quit. The show had good guests, loyal listeners, and strong feedback, but the revenue model was exhausting. Every episode created one moment of attention, then disappeared into the archive. Sponsors wanted downloads, clients wanted proof, and the founder was spending more time promoting episodes than making the show better.

The turning point came from a listener email. A founder wrote that one ten-minute segment helped him rewrite his onboarding emails and recover a stalled deal. That email changed the lens. The podcast was not only a media property. It was a source library filled with customer language, founder stories, hard-won lessons, and proof moments. Instead of treating every episode as a weekly event, the team began treating each recording as raw material for a month-long content system.

The founder built a simple workflow. Every episode was transcribed, then marked for emotional moments, sharp claims, objections, numbers, and personal stories. The strongest three hooks became the campaign anchors. One became a thread. One became a LinkedIn story. One became a Reel. Shorter moments became captions, newsletter sections, and sales snippets. The audience noticed because the content stopped feeling like recycled podcast promotion. It felt like a steady stream of useful ideas.

The show did not grow because the team posted more. It grew because the team extracted better. Sponsors saw clearer themes. Guests shared tighter clips. Listeners had more ways to enter the episode. By the end, the founder said the lesson was painfully simple: the content was already there, but the system for finding it was missing.`,
  blog: `Cold email has a reputation problem because most teams treat it like a volume game. They buy a list, write a vague compliment, add three feature bullets, and hope one sentence feels personal enough to pass. The inbox tells a different story. Buyers ignore emails that sound efficient for the sender instead of relevant for the recipient.

The modern cold email playbook starts with a trigger. A company raised funding, hired a new leader, opened a new region, changed pricing, launched a product, or showed intent. That trigger is the reason for the message. The second ingredient is pain. Not generic pain, but a problem tied to the buyer's role and timing. The third ingredient is proof. A short, specific result beats a broad claim every time.

A strong email is shorter than most teams expect. The first line should prove relevance. The second should name a problem. The third should offer a useful next step. The ask should feel easy to answer. The best campaigns also reuse learning. Replies become objection libraries. Objections become new angles. New angles become better sequences. Cold email improves when it becomes a research loop, not a send button.

The article closes with a warning: AI can make bad cold email faster, or it can make good research easier. The difference is whether the human team supplies real triggers, proof, and judgment. Automation should compress the busywork, not remove the thinking.`,
  youtube: `The creator begins the video by showing an old analytics dashboard: ninety days, dozens of videos, almost no movement. Then one upload changed the slope. The lesson was not that the video was lucky. It was that the creator finally understood the promise viewers wanted before they clicked.

The first mistake was making videos around topics instead of transformations. A topic says what the video is about. A transformation says what changes for the viewer. The creator rewrote every title around the after-state: get your first sponsor, edit faster, write hooks that make people stay, build a repeatable upload system. The second mistake was treating retention as a graph to admire instead of a script diagnostic tool. Every drop-off pointed to a moment where the video stopped earning attention.

The channel reached one hundred thousand subscribers after the creator built a pre-production checklist. Each idea needed a clear viewer, a painful before-state, a desirable after-state, three curiosity loops, and a concrete payoff by the first minute. The best videos came from comments, client questions, and repeated mistakes in the niche. The creator stopped chasing trends and started mining audience language.

The final lesson was emotional. Growth accelerated when the creator stopped trying to look impressive and started being useful with conviction. Viewers subscribed because each video made a promise, delivered quickly, and gave them a reason to trust the next upload.`,
};

const hookSets = {
  "demo-founder-podcast": [
    ["I almost quit because every episode vanished after launch.", "Story", 94],
    ["Your podcast is not a weekly event. It is a source library.", "Data", 91],
    ["The content was already there. The extraction system was missing.", "Curiosity gap", 89],
    ["Posting more did not grow the show. Extracting better did.", "Controversy", 87],
    ["One listener email changed the entire business model.", "Story", 84],
  ],
  "demo-cold-email-blog": [
    ["Cold email fails when it is efficient for you, not relevant to them.", "Controversy", 93],
    ["A trigger is the reason your email deserves to exist.", "Data", 90],
    ["AI can make bad outbound faster or good research easier.", "Controversy", 88],
    ["The best cold email is shorter than your first draft.", "Curiosity gap", 85],
    ["Replies are not outcomes. They are research data.", "Data", 82],
  ],
  "demo-100k-youtube": [
    ["A topic tells viewers what it is. A transformation tells them why to click.", "Curiosity gap", 95],
    ["Retention drops are not analytics. They are script notes.", "Data", 92],
    ["The first viral video was not lucky. It finally made the right promise.", "Story", 90],
    ["Trends did less than mining audience language.", "Controversy", 87],
    ["Subscribers came from trust, not polish.", "Story", 84],
  ],
} satisfies Record<string, Array<[string, string, number]>>;

const copySets = {
  "demo-founder-podcast": {
    tweet: [
      "Your podcast episode should not disappear after launch. Transcribe it, find the emotional moments, and turn the strongest 3 hooks into a month of posts.",
      "Most podcasters do not have a distribution problem. They have a signal extraction problem.",
      "One listener email changed the business: the episode was not content. It was proof, language, and positioning waiting to be reused.",
      "Posting more did not grow the show. Extracting better did.",
      "If your best ideas live only in the audio archive, your content system is leaking value.",
    ],
    linkedin: [
      "The founder almost quit because every episode felt temporary.\n\nGood guest. Good feedback. A short spike of attention. Then silence.\n\nThe shift happened when the team stopped treating the podcast as a weekly event and started treating it as a source library.\n\nOne episode became hooks, posts, captions, sales snippets, and proof.",
      "A podcast can be more than a media channel.\n\nIt can be the place where customer language, founder stories, and proof moments collect every week.\n\nThe mistake is publishing the episode and moving on.\n\nThe opportunity is extracting the moments that deserve a second life.",
      "The content was already there.\n\nThe problem was the system for finding it.\n\nOnce the team marked emotional moments, sharp claims, objections, and numbers, every episode became a campaign instead of a calendar item.",
      "The show grew when the content stopped sounding like podcast promotion.\n\nIt started sounding like useful ideas pulled from real conversations.\n\nThat is the difference between repurposing and recycling.",
    ],
    reels: [
      "Hook: Your podcast is hiding a month of content.\nValue: Do not post the episode once and move on. Pull the emotional moments, sharp claims, and proof points. Turn the top three hooks into a thread, a LinkedIn story, and a Reel.\nCTA: Save this before your next recording.",
      "Hook: Stop promoting episodes. Start extracting signal.\nValue: The best clips are not always the loudest moments. Look for tension, transformation, and listener pain.\nCTA: Send this to your producer.",
      "Hook: One listener email changed the whole podcast.\nValue: That email proved the show was not only entertainment. It was a source of useful business language.\nCTA: Mine your inbox before your next content sprint.",
    ],
    captions: [
      "A podcast episode should become more than one launch post. Start with the strongest emotional moment, then rebuild it for every platform.",
      "Repurposing works when the source has tension. Find the moment where the guest admits the hard part.",
      "Your archive is not old content. It is unused signal.",
    ],
    youtube: [
      "Poll: What should we turn this episode into next?\n\nA) Founder breakdown\nB) Guest clip series\nC) Revenue lessons\nD) Behind-the-scenes workflow",
      "The biggest lesson from this episode: the archive was not the problem. The missing extraction system was.",
      "Community question: what is the one moment from a podcast episode that made you rethink your business?",
    ],
  },
  "demo-cold-email-blog": {
    tweet: [
      "Cold email is not dead. Lazy relevance is.",
      "A trigger is the reason your email deserves to exist. Without it, personalization is just decoration.",
      "The best outbound teams treat replies as research data, not just conversion events.",
      "AI can make bad cold email faster. It can also make good research cheaper. The input decides.",
      "Your first line should prove relevance. Your second should name the pain. Your third should make the next step easy.",
    ],
    linkedin: [
      "Most cold email fails before the first sentence is written.\n\nThe team starts with a list instead of a trigger.\n\nA trigger gives the message a reason to exist: a new hire, funding round, product launch, expansion, or intent signal.\n\nWithout that, personalization becomes theater.",
      "A strong cold email does not need to be long.\n\nProve relevance. Name the problem. Offer a low-friction next step.\n\nThe hard part is not the writing. It is the research and judgment before the writing.",
      "AI changes outbound in two opposite ways.\n\nIt can help teams blast more generic messages.\n\nOr it can help them find better triggers, summarize proof, and draft sharper first lines.\n\nThe tool is not the strategy.",
      "Replies are not just pipeline.\n\nThey are objections, language, timing signals, and market feedback.\n\nThe best teams feed that learning back into the next sequence.",
    ],
    reels: [
      "Hook: Cold email fails when it is efficient for you.\nValue: Buyers respond to timing, pain, and proof. Start with a real trigger, not a fake compliment.\nCTA: Rewrite your first line today.",
      "Hook: AI will not save lazy outbound.\nValue: It can summarize research and sharpen copy, but it cannot invent relevance from nothing.\nCTA: Save this before building your next sequence.",
      "Hook: Your cold email is too long.\nValue: Relevance, pain, proof, ask. That is the structure.\nCTA: Cut one paragraph before you send.",
    ],
    captions: [
      "The inbox rewards relevance, not effort. Start every cold email with a trigger.",
      "A good outbound system learns from every reply.",
      "Shorter emails work when the thinking before the email is sharper.",
    ],
    youtube: [
      "Poll: Which cold email problem do you want fixed first?\n\nA) First lines\nB) Proof\nC) Follow-ups\nD) Reply handling",
      "A trigger is the reason your email deserves to exist. Without one, personalization is just decoration.",
      "Question for founders: would you rather get fewer highly relevant emails or more broad outreach with a faster follow-up?",
    ],
  },
  "demo-100k-youtube": {
    tweet: [
      "A topic says what the video is about. A transformation says why anyone should click.",
      "Retention drops are script notes. Every dip is the viewer telling you where trust broke.",
      "The first viral video was not lucky. It finally made a promise viewers wanted.",
      "Trends helped less than reading comments and stealing the audience's exact language.",
      "YouTube growth accelerated when the creator stopped looking impressive and started being useful with conviction.",
    ],
    linkedin: [
      "The channel did not grow because the creator found a magic topic.\n\nIt grew because every video started promising a clear transformation.\n\nBefore: I want to learn editing.\nAfter: I can edit a short in 20 minutes.\n\nThat difference changes the title, intro, script, and payoff.",
      "Retention is not just a performance metric.\n\nIt is a script diagnostic tool.\n\nEvery drop-off asks a question: did the promise weaken, did the example drag, did the viewer lose the thread?",
      "The creator stopped chasing trends and started mining audience language.\n\nComments, client questions, and repeated beginner mistakes became the idea pipeline.\n\nThat is how the content got specific enough to spread.",
      "Polish did not create trust.\n\nDelivering the promise quickly did.\n\nViewers subscribed because each video proved the next one would respect their time.",
    ],
    reels: [
      "Hook: Your title needs a transformation, not a topic.\nValue: A topic says what it is about. A transformation says what changes for the viewer after watching.\nCTA: Rewrite one title with the after-state.",
      "Hook: Retention drops are script notes.\nValue: Do not just stare at the graph. Find the moment where curiosity, clarity, or payoff broke.\nCTA: Audit your last upload.",
      "Hook: Stop chasing trends. Mine your comments.\nValue: The audience is already telling you the language they trust.\nCTA: Save five exact phrases today.",
    ],
    captions: [
      "The best video ideas promise a change the viewer actually wants.",
      "Retention is your audience editing the script for you.",
      "Growth came from being useful with conviction, not looking flawless.",
    ],
    youtube: [
      "Poll: What should the next creator breakdown cover?\n\nA) Titles\nB) Retention\nC) Thumbnails\nD) Upload systems",
      "A topic tells viewers what the video is. A transformation tells them why to click.",
      "Community question: what was the exact moment you subscribed to a creator because they earned your trust?",
    ],
  },
};

function buildHooks(projectId: keyof typeof hookSets): ViralHook[] {
  return hookSets[projectId].map(([text, hookType, reachScore], index) => ({
    id: `${projectId}-hook-${index + 1}`,
    projectId,
    text,
    hookType,
    reachScore,
  }));
}

function content(
  projectId: keyof typeof copySets,
  platform: Platform,
  contentType: string,
  body: string,
  index: number,
  approved = false,
): ContentPiece {
  return {
    id: `${projectId}-content-${index}`,
    projectId,
    hookId: `${projectId}-hook-${((index - 1) % 5) + 1}`,
    platform,
    contentType,
    body,
    originalBody: body,
    tone: "casual",
    approved,
    order: index,
    createdAt: new Date(now - index * 1000 * 60 * 9).toISOString(),
  };
}

function contents(projectId: keyof typeof copySets): ContentPiece[] {
  const copy = copySets[projectId];
  return [
    ...copy.tweet.map((body, index) => content(projectId, "TWITTER", `Tweet ${index + 1}`, body, index + 1, index < 2)),
    ...copy.linkedin.map((body, index) => content(projectId, "LINKEDIN", `LinkedIn post ${index + 1}`, body, index + 6, index < 2)),
    ...copy.reels.map((body, index) => content(projectId, "INSTAGRAM", `Reel script ${index + 1}`, body, index + 10)),
    ...copy.captions.map((body, index) => content(projectId, "INSTAGRAM", `Caption ${index + 1}`, body, index + 13)),
    ...copy.youtube.map((body, index) => content(projectId, "YOUTUBE", `Community post ${index + 1}`, body, index + 16, index === 0)),
  ];
}

function outputs(projectId: keyof typeof copySets): SocialOutput[] {
  return contents(projectId).map((item) => ({
    id: item.id,
    projectId: item.projectId,
    platform: item.platform,
    outputType: item.contentType,
    content: item.body,
    originalContent: item.originalBody,
    tone: item.tone,
    approved: item.approved,
    createdAt: item.createdAt,
  }));
}

function summary(projectId: keyof typeof hookSets, tldr: string, topics: string[]) {
  const hooks = hookSets[projectId].map(([text]) => text);
  return {
    ...defaultSummary,
    tldr,
    hooks: [...hooks, ...defaultSummary.hooks].slice(0, 10),
    topics,
  };
}

export const demoProjects: Project[] = [
  {
    id: "demo-founder-podcast",
    userId: "demo-user",
    title: "Founder Podcast Ep. 42 - Why I Almost Quit",
    sourceType: "PODCAST",
    sourceUrl: "demo://founder-podcast-42",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80",
    transcript: transcripts.podcast,
    duration: 47 * 60,
    wordCount: transcripts.podcast.split(/\s+/).length,
    summary: summary(
      "demo-founder-podcast",
      "A founder nearly quit after realizing each podcast episode vanished after launch. The turnaround came from treating every episode as a source library and extracting hooks, proof, stories, and reusable campaign assets.",
      ["podcasting", "creator workflow", "repurposing"],
    ),
    hooks: buildHooks("demo-founder-podcast"),
    contents: contents("demo-founder-podcast"),
    outputs: outputs("demo-founder-podcast"),
    createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
    status: "SCHEDULED",
  },
  {
    id: "demo-cold-email-blog",
    userId: "demo-user",
    title: "The Ultimate Guide to Cold Email in 2024",
    sourceType: "BLOG",
    sourceUrl: "https://example.com/cold-email-2024",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=900&q=80",
    transcript: transcripts.blog,
    duration: 0,
    wordCount: transcripts.blog.split(/\s+/).length,
    summary: summary(
      "demo-cold-email-blog",
      "The guide reframes cold email as a relevance and research workflow, not a volume game. It argues that triggers, role-specific pain, proof, and reply learning create better outbound than generic AI-generated blasts.",
      ["cold email", "sales", "AI outbound"],
    ),
    hooks: buildHooks("demo-cold-email-blog"),
    contents: contents("demo-cold-email-blog"),
    outputs: outputs("demo-cold-email-blog"),
    createdAt: new Date(now - 1000 * 60 * 60 * 32).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
    status: "DRAFT",
  },
  {
    id: "demo-100k-youtube",
    userId: "demo-user",
    title: "How I Got 100k Subscribers in 90 Days",
    sourceType: "YOUTUBE",
    sourceUrl: "https://youtube.com/watch?v=demo",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=900&q=80",
    transcript: transcripts.youtube,
    duration: 14 * 60,
    wordCount: transcripts.youtube.split(/\s+/).length,
    summary: summary(
      "demo-100k-youtube",
      "A YouTube creator explains how the channel hit 100k subscribers by shifting from topics to transformations. The system used audience language, retention drops, curiosity loops, and fast payoff to build trust.",
      ["YouTube growth", "retention", "creator strategy"],
    ),
    hooks: buildHooks("demo-100k-youtube"),
    contents: contents("demo-100k-youtube"),
    outputs: outputs("demo-100k-youtube"),
    createdAt: new Date(now - 1000 * 60 * 60 * 70).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    status: "PUBLISHED",
  },
];

export const demoBrandVoices: BrandVoice[] = [
  {
    id: "demo-brand-voice",
    name: "Creator strategist",
    toneDescriptors: ["direct", "useful", "specific", "warm", "evidence-led"],
    bannedWords: ["game-changer", "unlock", "fast-paced world"],
    samplePosts: [
      "The best content systems do not start with formats. They start with proof.",
      "If the hook does not create tension, the post has to work too hard.",
      "Repurposing is not recycling. It is translation.",
    ],
    targetAudience: "Founders, creators, and content teams",
    contentPillars: ["viral hooks", "AI workflows", "creator operations"],
  },
];

export const demoScheduledPosts: ScheduledPost[] = [
  {
    id: "scheduled-demo-1",
    outputId: "demo-founder-podcast-content-6",
    contentId: "demo-founder-podcast-content-6",
    platform: "LINKEDIN",
    publishAt: new Date(now + 1000 * 60 * 60 * 20).toISOString(),
    scheduledAt: new Date(now + 1000 * 60 * 60 * 20).toISOString(),
    status: "SCHEDULED",
    title: "Podcast source library",
  },
  {
    id: "scheduled-demo-2",
    outputId: "demo-cold-email-blog-content-1",
    contentId: "demo-cold-email-blog-content-1",
    platform: "TWITTER",
    publishAt: new Date(now + 1000 * 60 * 60 * 44).toISOString(),
    scheduledAt: new Date(now + 1000 * 60 * 60 * 44).toISOString(),
    status: "SCHEDULED",
    title: "Cold email relevance",
  },
  {
    id: "scheduled-demo-3",
    outputId: "demo-100k-youtube-content-16",
    contentId: "demo-100k-youtube-content-16",
    platform: "YOUTUBE",
    publishAt: new Date(now + 1000 * 60 * 60 * 68).toISOString(),
    scheduledAt: new Date(now + 1000 * 60 * 60 * 68).toISOString(),
    status: "SCHEDULED",
    title: "Creator breakdown poll",
  },
  {
    id: "history-demo-1",
    outputId: "demo-100k-youtube-content-10",
    contentId: "demo-100k-youtube-content-10",
    platform: "INSTAGRAM",
    publishAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    scheduledAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    status: "PUBLISHED",
    publishedAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    title: "YouTube transformation Reel",
  },
  {
    id: "history-demo-2",
    outputId: "demo-founder-podcast-content-1",
    contentId: "demo-founder-podcast-content-1",
    platform: "TWITTER",
    publishAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    scheduledAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    status: "PUBLISHED",
    publishedAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    title: "Podcast archive tweet",
  },
  {
    id: "history-demo-3",
    outputId: "demo-cold-email-blog-content-6",
    contentId: "demo-cold-email-blog-content-6",
    platform: "LINKEDIN",
    publishAt: new Date(now - 1000 * 60 * 60 * 76).toISOString(),
    scheduledAt: new Date(now - 1000 * 60 * 60 * 76).toISOString(),
    status: "FAILED",
    failReason: "LinkedIn token expired",
    title: "Cold email trigger post",
  },
  {
    id: "history-demo-4",
    outputId: "demo-100k-youtube-content-2",
    contentId: "demo-100k-youtube-content-2",
    platform: "TWITTER",
    publishAt: new Date(now - 1000 * 60 * 60 * 122).toISOString(),
    scheduledAt: new Date(now - 1000 * 60 * 60 * 122).toISOString(),
    status: "PUBLISHED",
    publishedAt: new Date(now - 1000 * 60 * 60 * 122).toISOString(),
    title: "Retention script note",
  },
  {
    id: "history-demo-5",
    outputId: "demo-founder-podcast-content-17",
    contentId: "demo-founder-podcast-content-17",
    platform: "YOUTUBE",
    publishAt: new Date(now - 1000 * 60 * 60 * 210).toISOString(),
    scheduledAt: new Date(now - 1000 * 60 * 60 * 210).toISOString(),
    status: "CANCELLED",
    title: "Podcast community question",
  },
];

export function getDemoProject(projectId: string) {
  if (projectId === "demo-ai-youtube") return getDemoProject("demo-100k-youtube");
  if (projectId === "demo-marketing-blog") return getDemoProject("demo-cold-email-blog");
  return demoProjects.find((project) => project.id === projectId);
}

export function getDemoProjectBySource(source: "youtube" | "podcast" | "blog" | "text") {
  if (source === "youtube") return getDemoProject("demo-100k-youtube");
  if (source === "blog") return getDemoProject("demo-cold-email-blog");
  return getDemoProject("demo-founder-podcast");
}

export function countOutputsByPlatform(project: Project) {
  return project.outputs.reduce<Record<Platform, number>>(
    (acc, outputItem) => {
      acc[outputItem.platform] += 1;
      return acc;
    },
    {
      TWITTER: 0,
      LINKEDIN: 0,
      INSTAGRAM: 0,
      FACEBOOK: 0,
      THREADS: 0,
      TIKTOK: 0,
      YOUTUBE: 0,
      CAROUSEL: 0,
      COMMUNITY: 0,
      STORY: 0,
    },
  );
}
