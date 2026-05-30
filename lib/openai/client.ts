import OpenAI from "openai";

let openai: OpenAI | undefined;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return undefined;
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}
