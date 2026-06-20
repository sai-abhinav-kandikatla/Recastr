"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RewriteMode } from "@/lib/ai/rewrite";
import { ContentActionBar } from "./ContentActionBar";

const REWRITE_MODES: { label: string; value: RewriteMode }[] = [
  { label: "Professional", value: "professional" },
  { label: "Casual", value: "casual" },
  { label: "Storytelling", value: "storytelling" },
  { label: "Viral", value: "viral" },
  { label: "Educational", value: "educational" },
  { label: "Founder", value: "founder" },
  { label: "Personal Brand", value: "personal_brand" },
];

interface ContentOutputProps {
  initialContent: string;
  platform: string;
  extractedFacts?: object;
  projectId?: string;
  contentId?: string;
  onSave?: (newBody: string) => Promise<void>;
  hideOpenWorkspace?: boolean;
}

export function ContentOutput({ 
  initialContent, 
  platform, 
  extractedFacts,
  projectId,
  contentId,
  onSave,
  hideOpenWorkspace = false
}: ContentOutputProps) {
  const [content, setContent] = useState(initialContent);
  const [activeMode, setActiveMode] = useState<RewriteMode | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [history, setHistory] = useState<string[]>([initialContent]);

  // Sync state if initialContent changes
  useEffect(() => {
    setContent(initialContent);
    setActiveMode(null);
    setHistory([initialContent]);
  }, [initialContent]);

  const handleModeClick = useCallback(async (mode: RewriteMode) => {
    // If already active and same mode clicked — reset to original
    if (activeMode === mode) {
      setActiveMode(null);
      setContent(history[0]);
      return;
    }

    setActiveMode(mode);
    setIsRewriting(true);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: history[0], // always rewrite from the ORIGINAL, not the last rewrite
          platform: platform.toUpperCase(),
          mode,
          extractedFacts,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Rewrite failed");
      }

      setContent(data.content);
      setHistory((prev) => [...prev, data.content]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Rewrite failed. Please try again.");
      setActiveMode(null);
    } finally {
      setIsRewriting(false);
    }
  }, [activeMode, history, platform, extractedFacts]);

  const handleLocalSave = async () => {
    if (!onSave) return;
    await onSave(content);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Rewrite Mode Selector */}
      <div>
        <p className="text-sm font-semibold text-white mb-2">Rewrite Mode</p>
        <div className="flex flex-wrap gap-2">
          {REWRITE_MODES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleModeClick(value)}
              disabled={isRewriting}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeMode === value
                  ? "border-blue-400 text-blue-400 bg-blue-400/10"
                  : "border-[#232323] bg-[#151515] text-neutral-300 hover:border-neutral-400 hover:text-white"
              } ${isRewriting && activeMode === value ? "opacity-70 cursor-wait" : ""} disabled:cursor-not-allowed`}
            >
              {isRewriting && activeMode === value ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Rewriting...
                </span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>
        {activeMode && !isRewriting && (
          <p className="text-xs text-neutral-500 mt-1.5">
            Showing {activeMode.replace("_", " ")} rewrite ·{" "}
            <button
              onClick={() => {
                setActiveMode(null);
                setContent(history[0]);
              }}
              className="underline hover:text-neutral-300 transition-colors"
            >
              Reset to original
            </button>
          </p>
        )}
      </div>

      {/* Content Display Area */}
      <div className="relative min-h-[300px] rounded-xl border border-dashed border-neutral-800 bg-[#090909] p-6">
        {isRewriting && (
          <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center z-10 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <p className="text-sm text-neutral-400">Rewriting in {activeMode?.replace("_", " ")} mode...</p>
            </div>
          </div>
        )}
        <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-sans leading-relaxed">
          {content}
        </pre>
      </div>

      {/* Action Bar */}
      <ContentActionBar
        content={content}
        projectId={projectId}
        contentId={contentId}
        platform={platform}
        onSave={onSave ? handleLocalSave : undefined}
        hideOpenWorkspace={hideOpenWorkspace}
      />
    </div>
  );
}
