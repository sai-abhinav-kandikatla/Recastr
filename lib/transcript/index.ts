import { YoutubeTranscript } from "youtube-transcript";
import { fetchTranscriptSupadata } from "./supadata";

/**
 * Unified YouTube transcript fetcher with fallback chain.
 *
 * Tries providers in reliability order:
 * 1. Supadata (managed API — works on Vercel datacenter IPs)
 * 2. youtube-transcript package (works on residential IPs / local dev)
 *
 * Returns the full transcript text or null if all providers fail.
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  if (!videoId) {
    console.error("[fetchTranscript] No videoId provided");
    return null;
  }

  console.log(`[fetchTranscript] Starting transcript fetch for videoId: ${videoId}`);

  // --- Provider 1: Supadata (managed API, handles IP rotation) ---
  const supadataResult = await fetchTranscriptSupadata(videoId);
  if (supadataResult) {
    console.log(`[fetchTranscript] ✅ Supadata succeeded for videoId: ${videoId}`);
    return supadataResult;
  }
  console.log(`[fetchTranscript] Supadata failed, trying youtube-transcript package...`);

  // --- Provider 2: youtube-transcript npm package ---
  const ytResult = await fetchTranscriptYoutubePackage(videoId);
  if (ytResult) {
    console.log(`[fetchTranscript] ✅ youtube-transcript package succeeded for videoId: ${videoId}`);
    return ytResult;
  }

  console.error(`[fetchTranscript] ❌ All providers failed for videoId: ${videoId}`);
  return null;
}

/**
 * Fetch transcript using the youtube-transcript npm package.
 * Works reliably on residential IPs but gets blocked on Vercel datacenter IPs.
 */
async function fetchTranscriptYoutubePackage(videoId: string): Promise<string | null> {
  try {
    console.log(`[youtube-transcript] Fetching transcript for videoId: ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      console.error(`[youtube-transcript] Empty transcript for videoId: ${videoId}`);
      return null;
    }

    const fullText = transcript.map((item) => item.text).join(" ");
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    console.log(`[youtube-transcript] Got ${wordCount} words for videoId: ${videoId}`);

    if (wordCount < 50) {
      console.warn(`[youtube-transcript] Transcript too short (${wordCount} words) for videoId: ${videoId}`);
      return null;
    }

    return fullText;
  } catch (error) {
    console.error(`[youtube-transcript] Error for videoId ${videoId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}
