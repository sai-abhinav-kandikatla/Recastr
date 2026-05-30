import type { SourceSummary } from "@/lib/types";

export type ViralHookInsight = {
  hook: string;
  score: number;
  driver: string;
  suggestion: string;
};

const drivers = [
  "Contrarian tension",
  "Clear transformation",
  "Founder pain",
  "Emotional specificity",
  "Curiosity gap",
  "Audience identity",
];

export function getViralHookInsights(summary: SourceSummary): ViralHookInsight[] {
  return summary.hooks.slice(0, 6).map((hook, index) => {
    const score = Math.max(72, 96 - index * 4 + (hook.length % 3));
    return {
      hook,
      score,
      driver: drivers[index % drivers.length],
      suggestion: `Open with: "${tightenHook(hook)}"`,
    };
  });
}

function tightenHook(hook: string) {
  const trimmed = hook.replace(/\.$/, "");
  if (trimmed.length <= 86) return trimmed;
  return `${trimmed.slice(0, 83).trim()}...`;
}
