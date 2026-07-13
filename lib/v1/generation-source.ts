import type { Project } from "@/lib/types";
import { prepareGenerationSource } from "@/lib/v1/generation-validation";

const TRANSCRIPT_UNAVAILABLE_PATTERN = /Transcript:\s*Transcript (?:was |is )?unavailable/i;

export function buildGenerationSource(project: Project) {
  const storedSource = project.sourceText?.trim() || project.transcript?.trim();
  if (storedSource) {
    const transcriptUnavailable =
      TRANSCRIPT_UNAVAILABLE_PATTERN.test(storedSource) ||
      /transcript unavailable/i.test(project.summary?.tldr ?? "");
    return {
      sourceDocument: prepareGenerationSource(storedSource),
      transcriptAvailable: !transcriptUnavailable,
      sourceMode: transcriptUnavailable ? "metadata" : "transcript",
    } as const;
  }

  const summary = project.summary;
  const metadataDocument = [
    "VIDEO INFORMATION",
    "",
    "Title:",
    project.title?.trim(),
    "",
    "Source URL:",
    project.sourceUrl?.trim(),
    "",
    "Description / summary:",
    summary?.tldr?.trim(),
    ...(summary?.takeaways ?? []).map((item) => `- ${item}`),
    "",
    "Topics / tags:",
    ...(summary?.topics ?? []).map((item) => `- ${item}`),
    "",
    "Target audience:",
    summary?.targetAudience?.trim(),
    "",
    "END OF SOURCE",
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .trim();

  return {
    sourceDocument: prepareGenerationSource(metadataDocument),
    transcriptAvailable: false,
    sourceMode: "metadata",
  } as const;
}
