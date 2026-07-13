"use client";

import React, { createContext, useContext, useState, useEffect, Component, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { emitCreditExhausted } from "@/lib/client-api";
import type { Platform, Project, SocialOutput } from "@/lib/types";

type GeneratorState = {
  project: Project | null;
  setProject: (p: Project | null) => void;
  selectedPlatforms: Platform[];
  setSelectedPlatforms: (p: Platform[]) => void;
  togglePlatform: (p: Platform) => void;
  tone: string;
  setTone: (t: string) => void;
  isGenerating: boolean;
  setIsGenerating: (b: boolean) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (b: boolean) => void;
  progress: string;
  setProgress: (p: string) => void;
  generate: () => Promise<void>;
  outputs: SocialOutput[];
  setOutputs: (o: SocialOutput[]) => void;
  activePreviewTab: Platform;
  setActivePreviewTab: (p: Platform) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
};

const GeneratorContext = createContext<GeneratorState | null>(null);

class GeneratorErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    console.error('[ERROR BOUNDARY] Caught render error:', error);
    console.error('[ERROR BOUNDARY] Stack:', error.stack);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ERROR BOUNDARY] componentDidCatch:', error);
    console.error('[ERROR BOUNDARY] componentStack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">Generator Error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

export function GeneratorProvider({
  children,
  project
}: {
  children: React.ReactNode;
  project: Project | null
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentProject, setCurrentProject] = useState<Project | null>(project);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "LINKEDIN",
    "TWITTER",
    "INSTAGRAM",
    "THREADS",
    "FACEBOOK",
    "COMMUNITY",
  ]);
  const [tone, setToneState] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<string>("idle");
  const [outputs, setOutputs] = useState<SocialOutput[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<Platform>("TWITTER");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [hasUserSelectedPreview, setHasUserSelectedPreview] = useState(false);

  // Sync state with prop if it changes
  useEffect(() => {
    setCurrentProject(project);
    if (project) {
      if (project.outputs && project.outputs.length > 0) {
        setOutputs(project.outputs);
        setActivePreviewTab(project.outputs[0].platform);
        setHasUserSelectedPreview(false);
        setProgress("completed");
      } else {
        setOutputs([]);
        setProgress("idle");
      }
    } else {
      setOutputs([]);
      setProgress("idle");
    }
  }, [project]);

  useEffect(() => {
    if (outputs.length === 0 || hasUserSelectedPreview) return;
    if (outputs.some((output) => output.platform === activePreviewTab)) return;
    setActivePreviewTab(outputs[0].platform);
  }, [activePreviewTab, hasUserSelectedPreview, outputs]);

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const runGeneration = async ({
    toneOverride = tone,
    platformsOverride = selectedPlatforms,
    isRegeneration = false,
  }: {
    toneOverride?: string;
    platformsOverride?: Platform[];
    isRegeneration?: boolean;
  } = {}) => {
    if (!currentProject) {
      toast.error("No project found");
      return;
    }
    if (platformsOverride.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    console.info("[generation-ui] generate_button_clicked", {
      projectId: currentProject.id,
      platforms: platformsOverride,
      tone: toneOverride,
      isRegeneration,
    });
    setIsGenerating(true);
    setProgress("extracting");
    setOutputs([]);
    setHasUserSelectedPreview(false);

    try {
      console.info("[generation-ui] api_request_sent");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          platforms: platformsOverride,
          contentTypes: ["platform-post"],
          tone: toneOverride,
          isRegeneration,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 403 && payload.code === "credit_exhausted") {
          emitCreditExhausted(payload);
        } else {
          toast.error(payload.error ?? "Generation failed");
        }
        setProgress("error");
        return;
      }

      if (!response.body) throw new Error("No stream");
      setProgress("generating");
      let hasActivatedFirstOutput = false;
      let receivedOutputCount = 0;
      let hadStreamError = false;
      let streamBuffer = "";

      const processEvent = (eventBlock: string) => {
        const payload = eventBlock
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s?/, ""))
          .join("\n");
        if (!payload) return;

        try {
          const parsed = JSON.parse(payload);
          if (parsed.stage) console.info(`[generation-ui] ${parsed.stage}`, parsed);
          if (parsed.error) {
            hadStreamError = true;
            setProgress("error");
            toast.error(parsed.error);
          } else if (parsed.output) {
            receivedOutputCount += 1;
            setOutputs((previous) => [...previous, parsed.output]);
            console.info("[generation-ui] ui_updated", {
              platform: parsed.output.platform,
              outputCount: receivedOutputCount,
            });
            if (!hasActivatedFirstOutput) {
              hasActivatedFirstOutput = true;
              setActivePreviewTab(parsed.output.platform);
            }
          }
          if (parsed.done && receivedOutputCount > 0) {
            setProgress("completed");
            toast.success("Content generated");
          }
        } catch (error) {
          console.error("[generation-ui] stream_parse_failed", { payloadLength: payload.length, error });
        }
      };

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamBuffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        const events = streamBuffer.split("\n\n");
        streamBuffer = events.pop() ?? "";
        events.filter(Boolean).forEach(processEvent);
      }
      streamBuffer += decoder.decode();
      if (streamBuffer.trim()) processEvent(streamBuffer);
      if (receivedOutputCount === 0 && !hadStreamError) {
        setProgress("error");
        toast.error("Generation finished without returning any posts. Please try again.");
      } else if (receivedOutputCount > 0 && !hadStreamError) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["projects"] }),
          queryClient.invalidateQueries({ queryKey: ["project", currentProject.id] }),
          queryClient.invalidateQueries({ queryKey: ["analytics"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
        ]);
        router.push(`/projects/${currentProject.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("[generation-ui] request_failed", error);
      setProgress("error");
      toast.error(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "Network disconnected. Reconnect and retry generation."
          : "The generation request was interrupted. Retry in a moment.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generate = async () => runGeneration();

  const setTone = (nextTone: string) => {
    setToneState(nextTone);
    if (!currentProject || outputs.length === 0 || isGenerating) return;
    const generatedPlatforms = Array.from(new Set(outputs.map((output) => output.platform)));
    void runGeneration({
      toneOverride: nextTone,
      platformsOverride: generatedPlatforms,
      isRegeneration: true,
    });
  };

  const selectPreviewTab = (platform: Platform) => {
    setHasUserSelectedPreview(true);
    setActivePreviewTab(platform);
  };

  return (
    <GeneratorContext.Provider value={{
      project: currentProject,
      setProject: setCurrentProject,
      selectedPlatforms,
      setSelectedPlatforms,
      togglePlatform,
      tone,
      setTone,
      isGenerating,
      setIsGenerating,
      isAnalyzing,
      setIsAnalyzing,
      progress,
      setProgress,
      generate,
      outputs,
      setOutputs,
      activePreviewTab,
      setActivePreviewTab: selectPreviewTab,
      theme,
      setTheme
    }}>
      <GeneratorErrorBoundary>
        {children}
      </GeneratorErrorBoundary>
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const context = useContext(GeneratorContext);
  if (!context) throw new Error("useGenerator must be used within GeneratorProvider");
  return context;
}
