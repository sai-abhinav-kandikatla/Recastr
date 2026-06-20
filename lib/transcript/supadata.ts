import { Supadata, SupadataError } from "@supadata/js";

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

/**
 * Fetch a YouTube transcript via the Supadata managed API.
 * Returns the full transcript text or null if unavailable.
 *
 * Supadata handles proxy rotation and IP reputation internally,
 * which solves YouTube's datacenter IP blocking on Vercel.
 */
export async function fetchTranscriptSupadata(videoId: string): Promise<string | null> {
  if (!SUPADATA_API_KEY) {
    console.warn("[Supadata] SUPADATA_API_KEY is not configured — skipping Supadata provider");
    return null;
  }

  if (!videoId) {
    console.error("[Supadata] No videoId provided");
    return null;
  }

  try {
    const client = new Supadata({ apiKey: SUPADATA_API_KEY });
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`[Supadata] Fetching transcript for videoId: ${videoId}`);
    const result = await client.transcript({ url, text: true, lang: "en" });

    if (!result || !("content" in result)) {
      console.error(`[Supadata] No transcript returned for videoId: ${videoId}`);
      return null;
    }

    // When text: true, content is a string. Otherwise it's TranscriptChunk[].
    let fullText: string;
    if (typeof result.content === "string") {
      fullText = result.content;
    } else if (Array.isArray(result.content)) {
      fullText = result.content.map((chunk) => chunk.text).join(" ");
    } else {
      console.error(`[Supadata] Unexpected content type: ${typeof result.content}`);
      return null;
    }

    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    console.log(`[Supadata] Success — ${wordCount} words for videoId: ${videoId}`);

    if (wordCount < 50) {
      console.warn(`[Supadata] Transcript too short (${wordCount} words) for videoId: ${videoId}`);
      return null;
    }

    return fullText;
  } catch (error) {
    if (error instanceof SupadataError) {
      console.error(`[Supadata] API error for videoId ${videoId}: ${error.error} — ${error.details}`);
      // transcript-unavailable means the video genuinely has no captions
      if (error.error === "transcript-unavailable") {
        return null;
      }
    }

    console.error("[Supadata] Unexpected error:", error instanceof Error ? error.message : error);
    return null;
  }
}
