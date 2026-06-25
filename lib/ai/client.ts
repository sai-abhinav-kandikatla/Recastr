import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

let gemini: GoogleGenAI | undefined;

export function getGeminiClient() {
  if (!env.geminiKey) return undefined;
  if (!env.geminiKey.startsWith("AIza")) {
    throw new Error("AI_CONFIG_INVALID: GEMINI_API_KEY must be a Google AI Studio API key.");
  }
  gemini ??= new GoogleGenAI({ apiKey: env.geminiKey });
  return gemini;
}
