import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

let gemini: GoogleGenAI | undefined;

export function getGeminiClient() {
  if (!env.geminiKey) return undefined;
  gemini ??= new GoogleGenAI({ apiKey: env.geminiKey });
  return gemini;
}

type GenerateGeminiTextOptions = {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  systemInstruction?: string;
};

export async function generateGeminiText({
  prompt,
  model = "gemini-2.5-flash",
  temperature,
  maxOutputTokens,
  responseMimeType,
  systemInstruction,
}: GenerateGeminiTextOptions): Promise<string> {
  const geminiClient = getGeminiClient();
  if (!geminiClient) {
    throw new Error("Gemini API client not configured.");
  }

  const response = await geminiClient.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      ...(typeof temperature === "number" ? { temperature } : {}),
      ...(typeof maxOutputTokens === "number" ? { maxOutputTokens } : {}),
      ...(responseMimeType ? { responseMimeType } : {}),
      ...(systemInstruction ? { systemInstruction } : {}),
    },
  });

  return (response.text ?? "").trim();
}
