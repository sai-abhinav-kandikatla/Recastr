import { YoutubeTranscript } from "youtube-transcript";

/**
 * Fetch YouTube transcript using the youtube-transcript package.
 *
 * Works reliably on residential IPs (local dev) but may fail
 * on Vercel datacenter IPs due to YouTube IP blocking.
 * Returns the full transcript text or null if fetching fails.
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  if (!videoId) {
    console.error("[fetchTranscript] No videoId provided");
    return null;
  }

  try {
    console.log(`[fetchTranscript] Fetching transcript for videoId: ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      console.error(`[fetchTranscript] Empty transcript for videoId: ${videoId}`);
      return null;
    }

    const fullText = transcript.map((item) => item.text).join(" ");
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    console.log(`[fetchTranscript] Got ${wordCount} words for videoId: ${videoId}`);

    if (wordCount < 50) {
      console.warn(`[fetchTranscript] Transcript too short (${wordCount} words) for videoId: ${videoId}`);
      return null;
    }

    return fullText;
  } catch (error) {
    console.error(`[fetchTranscript] Error for videoId ${videoId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}
