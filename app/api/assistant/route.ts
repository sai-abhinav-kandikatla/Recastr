import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { getGeminiClient } from "@/lib/ai/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const gemini = getGeminiClient();
    if (gemini && env.geminiKey) {
      try {
        const formattedContents = [];
        
        // Add conversation history if provided
        if (Array.isArray(history)) {
          for (const turn of history) {
            formattedContents.push({
              role: turn.role === "assistant" ? "model" : "user",
              parts: [{ text: turn.content }],
            });
          }
        }
        
        // Append current message
        formattedContents.push({
          role: "user",
          parts: [{ text: message }],
        });

        const systemInstruction = 
          "You are a helpful AI content assistant for ReCastr. ReCastr is a premium SaaS platform that helps users ingest YouTube videos, podcasts, blog posts, or text, and repurpose them into engaging social media content (such as Twitter threads, LinkedIn posts, Instagram captions, Facebook updates, Threads, and YouTube Community posts). Answer the user's questions about content strategy, writing hooks, growing their audience, or how to get the most out of ReCastr. Keep your responses structured, actionable, and formatted in clean markdown. Always maintain a professional yet engaging tone.";

        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: formattedContents,
          config: {
            temperature: 0.7,
            systemInstruction: systemInstruction,
          },
        });

        const replyText = response.text || "I'm sorry, I couldn't generate a response.";
        return NextResponse.json({ response: replyText });
      } catch (geminiError: any) {
        console.error("Gemini Assistant Error:", geminiError);
        // Fall back to rule-based mock if API fails
      }
    }

    // Smart Fallback Response System
    const replyText = getFallbackResponse(message);
    return NextResponse.json({ response: replyText });
  } catch (error: any) {
    console.error("Assistant API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

function getFallbackResponse(message: string): string {
  const query = message.toLowerCase();
  
  if (query.includes("hook") || query.includes("headline") || query.includes("title")) {
    return `### 🪝 How to Write Viral Hooks on ReCastr

A great hook is the single most important factor for social media reach. Here are 3 proven templates you can use:

1. **The Curiosity Gap:** "We analyzed 500 LinkedIn posts. The results were not what we expected..."
2. **The Contrarian Angle:** "Most gurus tell you to write daily. Here is why they are setting you up for failure:"
3. **The Clear Transformation:** "I went from 0 to 10k followers using this simple 3-step checklist. Here it is:"

*Tip: You can use the **Hooks & CTAs** platform templates in ReCastr's Generator view to automatically extract these from your sources!*`;
  }

  if (query.includes("linkedin") || query.includes("professional") || query.includes("b2b")) {
    return `### 💼 LinkedIn Repurposing Strategy

To stand out on LinkedIn, follow this format:
- **Hook:** Start with a strong statement or metric.
- **Context:** Explain why this matters (the "so what?").
- **Core Value:** Provide 3-5 bulleted takeaways. Avoid large walls of text.
- **Formatting:** Leave empty lines between paragraphs to make it highly readable.
- **CTA:** End with an engaging question to drive comments.

ReCastr's **LinkedIn template** automatically optimizes your source material for professional reader engagement.`;
  }

  if (query.includes("twitter") || query.includes("thread") || query.includes(" x ")) {
    return `### 🐦 Crafting Twitter/X Threads

Twitter threads are incredibly powerful for engagement. When repurposing your source to Twitter/X:
- Keep the first tweet punchy with a clear value proposition.
- Make each subsequent tweet a standalone valuable tip.
- Use simple formatting, bullet points, and numbers.
- End the thread with a CTA referencing the original source or newsletter.

ReCastr's **Twitter template** handles the character limits and automatically segments your content into thread-friendly pieces.`;
  }

  if (query.includes("youtube") || query.includes("video") || query.includes("short")) {
    return `### 🎥 Repurposing YouTube Videos

With ReCastr, you can turn a single YouTube URL into:
- A detailed **LinkedIn article** or post summarizing key insights.
- A **Twitter thread** detailing step-by-step takeaways.
- A **YouTube Community post** to engage subscribers who haven't watched the video yet.

Simply paste your YouTube URL in the Generator tab, select your platforms, and click **Generate Content**.`;
  }

  if (query.includes("hello") || query.includes("hi ") || query.includes("hey")) {
    return `### 👋 Welcome to ReCastr AI Assistant!

I'm your dedicated content strategist and assistant. I can help you with:
- Crafting engaging social media posts.
- Writing better hooks and CTAs.
- Structuring your content calendar.
- Getting started with ReCastr features.

**What platform are you looking to create content for today?**`;
  }

  return `### 🚀 Elevating Your Content Strategy

To get the most out of your source material, try these steps in ReCastr:
1. **Ingest a Source:** Go to the **Generate** tab and paste a YouTube link, blog post URL, or drop raw text.
2. **Select Tone & Platforms:** Choose the target platforms (like Twitter/X, LinkedIn, Instagram) and tone (e.g., Professional, Storytelling).
3. **Refine & Schedule:** Copy the optimized outputs or schedule them directly to your socials.

*Let me know if you have questions about specific platforms, writing styles, or how to write better hooks!*`;
}
