"use client";

import { cn } from "@/lib/utils";

const tones = [
  ["professional", "Clear, credible, executive."],
  ["casual", "Warm, direct, conversational."],
  ["educational", "Tactical, structured, useful."],
  ["entertaining", "Punchy, vivid, memorable."],
] as const;

export function ToneSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tones.map(([tone, preview]) => (
        <button
          key={tone}
          className={cn(
            "rounded-[12px] border p-4 text-left transition hover:border-primary",
            value === tone && "border-primary bg-primary/10",
          )}
          onClick={() => onChange(tone)}
          type="button"
        >
          <p className="text-sm font-medium capitalize">{tone}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{preview}</p>
        </button>
      ))}
    </div>
  );
}
