"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IngestionStep } from "@/lib/types";

export const ingestionSteps: IngestionStep[] = [
  "Fetching",
  "Extracting Audio",
  "Transcribing",
  "Analyzing",
  "Ready",
];

export function ProgressStepper({
  activeStep,
  completed = false,
  processing = false,
}: {
  activeStep: IngestionStep;
  completed?: boolean;
  processing?: boolean;
}) {
  const activeIndex = ingestionSteps.indexOf(activeStep);
  const idle = !processing && !completed;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {processing ? (
            <div className="absolute h-12 w-12 rounded-full border border-primary/25 animate-pulseRing" />
          ) : null}
          {completed ? (
            <Check className="h-5 w-5" />
          ) : processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Loader2 className="h-5 w-5 opacity-45" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {completed ? "Brain complete" : idle ? "Brain ready" : "Brain processing"}
          </p>
          <p className="text-xs text-muted-foreground">
            {completed
              ? "Source intelligence is ready."
              : processing
                ? `${activeStep} source material...`
                : "Paste a source and click Analyze."}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {ingestionSteps.map((step, index) => {
          const isDone = completed || (processing && index < activeIndex);
          const isActive = processing && index === activeIndex && !completed;
          return (
            <div key={step} className="min-w-0">
              <div
                className={cn(
                  "h-1.5 rounded-full bg-muted",
                  isDone && "bg-primary",
                  isActive && "bg-primary/70",
                )}
              />
              <p
                className={cn(
                  "mt-1 truncate text-[10px] text-muted-foreground",
                  (isDone || isActive) && "text-primary",
                )}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
