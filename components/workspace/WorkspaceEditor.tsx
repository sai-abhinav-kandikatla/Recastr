"use client";

import { useState } from "react";
import { ContentOutput } from "@/components/dashboard/ContentOutput";
import { toast } from "sonner";

const PLATFORMS = ["linkedin", "twitter", "instagram", "reel"];

interface WorkspaceEditorProps {
  project: any;
  defaultPlatform: string;
}

export function WorkspaceEditor({ project, defaultPlatform }: WorkspaceEditorProps) {
  const [activePlatform, setActivePlatform] = useState(() => {
    const requested = defaultPlatform.toLowerCase();
    return PLATFORMS.includes(requested) ? requested : "linkedin";
  });
  const [localOutputs, setLocalOutputs] = useState(() => project.outputs || []);

  const activePost = localOutputs.find(
    (p: any) => p.platform.toLowerCase() === activePlatform.toLowerCase()
  );

  const handleSave = async (newBody: string) => {
    if (!activePost) return;

    try {
      const response = await fetch(`/api/content/${activePost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newBody, approved: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      // Update local state to keep the new body
      setLocalOutputs((prev: any[]) =>
        prev.map((item) =>
          item.id === activePost.id ? { ...item, content: newBody, approved: true } : item
        )
      );

      toast.success("Saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save to database");
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col">
      {/* Workspace Header */}
      <header className="border-b border-[#232323] px-6 py-4 flex items-center justify-between bg-[#0e0e0e]">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-neutral-400 hover:text-white transition-colors text-sm">
            ← Dashboard
          </a>
          <span className="text-neutral-700">/</span>
          <h1 className="text-sm font-medium text-white">{project.title || "Untitled Project"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Platform tabs */}
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                activePlatform === p
                  ? "bg-white text-black font-semibold"
                  : "text-neutral-400 hover:text-white bg-[#151515] hover:bg-[#1e1e1e]"
              }`}
            >
              {p === "twitter" ? "X / Twitter" : p === "reel" ? "Instagram Reel" : p}
            </button>
          ))}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {activePost ? (
          <ContentOutput
            key={activePost.id}
            initialContent={activePost.content as string}
            platform={activePlatform}
            extractedFacts={project.summary} // uses standard serializeProject.summary object
            projectId={project.id}
            contentId={activePost.id}
            onSave={handleSave}
            hideOpenWorkspace={true} // already in workspace
          />
        ) : (
          <div className="text-center text-neutral-500 py-20 bg-[#111111] rounded-2xl border border-dashed border-[#232323] p-8">
            <p>No {activePlatform === "twitter" ? "X / Twitter" : activePlatform} content has been generated for this project yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
