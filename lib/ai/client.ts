import OpenAI from "openai";
import type { ResponseInput } from "openai/resources/responses/responses";
import { env } from "@/lib/env";

const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";

let openai: OpenAI | undefined;

export function getOpenAITextClient() {
  if (!env.openaiKey) return undefined;
  openai ??= new OpenAI({ apiKey: env.openaiKey });
  return openai;
}

export function getAIClient() {
  return getOpenAITextClient();
}

type GenerateAITextOptions = {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  systemInstruction?: string;
};

export async function generateAIText({
  prompt,
  model = DEFAULT_OPENAI_MODEL,
  temperature,
  maxOutputTokens,
  responseMimeType,
  systemInstruction,
}: GenerateAITextOptions): Promise<string> {
  const client = getOpenAITextClient();
  if (!client) {
    throw new Error("OpenAI API client not configured.");
  }

  const input: ResponseInput = [{ role: "user", content: prompt }];
  const resolvedModel = env.openaiModel ?? (model.startsWith("gpt-") ? model : DEFAULT_OPENAI_MODEL);
  const response = await client.responses.create({
    model: resolvedModel,
    input,
    instructions: systemInstruction,
    ...(typeof temperature === "number" ? { temperature } : {}),
    ...(typeof maxOutputTokens === "number" ? { max_output_tokens: maxOutputTokens } : {}),
    ...(responseMimeType === "application/json"
      ? { text: { format: { type: "json_object" } } }
      : { text: { verbosity: "medium" } }),
  });

  return (response.output_text ?? "").trim();
}

export function getConfiguredAIModel() {
  return env.openaiModel ?? DEFAULT_OPENAI_MODEL;
}
