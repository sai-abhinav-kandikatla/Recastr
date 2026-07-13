"use client";

import { useState, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project, ViralHook, ContentPiece, SocialOutput } from "@/lib/types";
import { type ContentCardPlatform } from "@/components/content/ContentCard";
import { platformLabels, platformOrder } from "./types";
import { fromCardPlatform } from "./utils";

const drawerSlide = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "spring" as const, bounce: 0, duration: 0.4 },
};

export function GenerateDrawer({
  project,
  selectedHook,
  onClose,
  onGenerated,
}: {
  project: Project;
  selectedHook?: ViralHook;
  onClose: () => void;
  onGenerated: (contents: ContentPiece[]) => void;
}) {
  const [platforms, setPlatforms] = useState<ContentCardPlatform[]>(["twitter", "linkedin"]);
  const [tone, setTone] = useState("casual");
  const [stream, setStream] = useState("");
  const [generating, setGenerating] = useState(false);

  const togglePlatform = useCallback((platform: ContentCardPlatform) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }, []);

  async function generate() {
    if (platforms.length === 0) return;
    setGenerating(true);
    setStream("Preparing source context...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          platforms: platforms.map(fromCardPlatform),
          contentTypes: ["platform-post"],
          tone,
          isRegeneration: true,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Generation failed.");
      }
      if (!response.body) throw new Error("The generation response was interrupted.");

      const generated: SocialOutput[] = [];
      let streamError = "";
      let buffer = "";
      const processEvent = (eventBlock: string) => {
        const data = eventBlock
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s?/, ""))
          .join("\n");
        if (!data) return;

        const event = JSON.parse(data) as {
          stage?: string;
          error?: string;
          output?: SocialOutput;
        };
        if (event.error) streamError = event.error;
        if (event.output) generated.push(event.output);
        if (event.stage === "llm_called") setStream("Writing platform-specific drafts...");
        if (event.stage === "database_saved") setStream("Quality checks passed. Saving drafts...");
      };

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        events.filter(Boolean).forEach(processEvent);
      }
      buffer += decoder.decode();
      if (buffer.trim()) processEvent(buffer);

      if (streamError) throw new Error(streamError);
      if (generated.length === 0) throw new Error("Generation returned no validated drafts.");

      const cards = generated.map(toContentPiece);
      onGenerated(cards);
      setStream(`${cards.length} validated drafts generated.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      setStream(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <motion.aside
      {...drawerSlide}
      className="fixed bottom-0 right-0 top-[var(--topbar-height)] z-30 w-full border-l bg-card shadow-soft sm:w-[420px]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-medium">Generate more</p>
            <p className="text-xs text-muted-foreground">
              {selectedHook ? "Using selected asset" : "Using full source"}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <ControlGroup title="Platforms">
            {platformOrder.map((platform) => (
              <TogglePill
                key={platform}
                active={platforms.includes(platform)}
                label={platformLabels[platform]}
                onClick={() => togglePlatform(platform)}
              />
            ))}
          </ControlGroup>

          <div>
            <p className="mb-3 text-sm font-medium">Tone</p>
            <div className="grid gap-2">
              {[
                ["professional", "Crisp, credible, decision-ready."],
                ["casual", "Human, direct, low-friction."],
                ["educational", "Structured, useful, tactical."],
                ["entertaining", "Punchy, visual, high-energy."],
              ].map(([value, sample]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTone(value)}
                  className={cn(
                    "rounded-[12px] border p-3 text-left transition hover:bg-muted",
                    tone === value && "border-primary bg-primary/10",
                  )}
                >
                  <p className="text-sm font-medium capitalize">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sample}</p>
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full bg-[var(--violet)] text-black hover:bg-[var(--violet-hover)]" disabled={generating} onClick={generate}>
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating" : "Generate"}
          </Button>

          <div className="min-h-32 rounded-[12px] border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {stream || "Ready to generate."}
            {generating ? <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" /> : null}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function TogglePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground",
        active && "border-[var(--violet)] bg-[var(--violet)] text-black hover:text-black",
      )}
    >
      {active ? <Check className="mr-1 inline h-3 w-3" /> : null}
      {label}
    </button>
  );
}

function toContentPiece(output: SocialOutput, index: number): ContentPiece {
  const body = typeof output.content === "string" ? output.content : JSON.stringify(output.content);
  const originalBody = typeof output.originalContent === "string" ? output.originalContent : body;
  return {
    id: output.id,
    projectId: output.projectId,
    platform: output.platform,
    contentType: output.outputType,
    body,
    originalBody,
    tone: String(output.tone),
    approved: output.approved,
    order: index,
    createdAt: output.createdAt,
  };
}
