"use client";

import { useState } from "react";
import { Copy, Save, Share2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGenerator } from "./GeneratorProvider";

function getActiveContent(outputs: ReturnType<typeof useGenerator>["outputs"], activeTab: string): string {
  const match = outputs.find((o) => o.platform === activeTab);
  if (!match) return "";
  if (typeof match.content === "string") {
    return match.content;
  }
  if (match.content && typeof match.content === "object") {
    const obj = match.content as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
  }
  return "";
}

export function ActionBar() {
  const { outputs, activePreviewTab, project } = useGenerator();
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    // Default to tomorrow at 9:00 AM local time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const offsetMs = tomorrow.getTimezoneOffset() * 60 * 1000;
    const localTime = new Date(tomorrow.getTime() - offsetMs);
    return localTime.toISOString().slice(0, 16);
  });

  const handleCopy = async () => {
    const content = getActiveContent(outputs, activePreviewTab);
    if (!content) {
      toast.error("No content to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleShare = async () => {
    const content = getActiveContent(outputs, activePreviewTab);
    if (!content) {
      toast.error("No content to share");
      return;
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "ReCastr Content", text: content });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          toast.error("Share failed");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(content);
        toast.success("Content copied — paste to share");
      } catch {
        toast.error("Failed to copy content");
      }
    }
  };

  const handleSave = async (silent = false) => {
    const contentText = getActiveContent(outputs, activePreviewTab);
    if (!contentText) {
      toast.error("No content to save");
      return null;
    }
    if (!project) {
      toast.error("Please ingest a source first");
      return null;
    }

    const matchingContent = project.contents?.find(
      (c) => c.platform.toUpperCase() === activePreviewTab.toUpperCase()
    );
    if (!matchingContent) {
      toast.error(`No content slot found for ${activePreviewTab} in this project.`);
      return null;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/content/${matchingContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: contentText, approved: true }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save content");
      }
      if (!silent) {
        toast.success("Content saved to project!");
      }
      return matchingContent.id;
    } catch (err) {
      toast.error("Failed to save content to database");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleDate) {
      toast.error("Please select a date and time");
      return;
    }
    const scheduledTime = new Date(scheduleDate);
    if (scheduledTime.getTime() <= Date.now()) {
      toast.error("Schedule time must be in the future");
      return;
    }

    setIsScheduling(true);
    try {
      // 1. Auto-save generated content to the database first
      const contentId = await handleSave(true);
      if (!contentId) {
        setIsScheduling(false);
        return;
      }

      // 2. Schedule the email reminder using schedule API
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          platform: activePreviewTab,
          scheduledAt: scheduledTime.toISOString(),
          postingMethod: "email_reminder",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule");
      }

      toast.success("Reminder scheduled successfully!");
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule reminder");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-[#232323] bg-[#151515] p-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="gap-2 border-[#232323] bg-[#090909] text-white hover:bg-[#232323]"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" /> Copy
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-[#232323] bg-[#090909] text-white hover:bg-[#232323]"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-[#232323] bg-[#090909] text-white hover:bg-[#232323]"
          onClick={() => {
            const content = getActiveContent(outputs, activePreviewTab);
            if (!content) {
              toast.error("No content to schedule");
              return;
            }
            if (!project) {
              toast.error("Please ingest a source first");
              return;
            }
            setIsModalOpen(true);
          }}
        >
          <Calendar className="h-4 w-4 text-[#8A8A8A]" /> Schedule Reminder
        </Button>
      </div>
      <Button
        className="gap-2 bg-white text-black hover:bg-zinc-200"
        onClick={() => handleSave(false)}
        disabled={isSaving}
      >
        <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save to Project"}
      </Button>

      {/* Schedule Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#232323] bg-[#0F0F0F] p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-white mb-2">Schedule Email Reminder</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Pick a date and time to receive an email reminder with this generated post for {activePreviewTab}.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Reminder Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-[#232323] bg-[#090909] px-4 py-3 text-sm text-white focus:border-[#444] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="border-[#232323] bg-[#090909] text-white hover:bg-[#151515]"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isScheduling}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-white text-black hover:bg-zinc-200"
                  onClick={handleConfirmSchedule}
                  disabled={isScheduling}
                >
                  {isScheduling ? "Scheduling..." : "Schedule Reminder"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
