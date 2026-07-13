import type { Project } from "@/lib/types";

const TRANSCRIPT_UNAVAILABLE_PATTERN = /Transcript:\s*Transcript unavailable/i;

export function buildGenerationSource(project: Project) {
  const storedSource = project.sourceText?.trim() || project.transcript?.trim();
  if (storedSource) {
    return {
      sourceDocument: storedSource,
      transcriptAvailable: !TRANSCRIPT_UNAVAILABLE_PATTERN.test(storedSource),
      sourceMode: TRANSCRIPT_UNAVAILABLE_PATTERN.test(storedSource) ? "metadata" : "transcript",
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
    "Transcript:",
    "Transcript unavailable. Use only the metadata above. Do not invent details.",
    "",
    "END OF SOURCE",
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .trim();

  return {
    sourceDocument: metadataDocument,
    transcriptAvailable: false,
    sourceMode: "metadata",
  } as const;
}
