import fs from "node:fs";
import { getOpenAIClient } from "@/lib/openai/client";

export async function transcribeAudioFile(filePath: string) {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error("openai_missing");
  }

  const result = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: fs.createReadStream(filePath),
    response_format: "verbose_json",
  });

  return {
    text: result.text,
    raw: result,
  };
}
