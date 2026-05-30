"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DevicePreviewShell, DeviceSwitcher } from "@/components/preview/DevicePreviewShell";
import { FacebookPreview } from "@/components/preview/platforms/FacebookPreview";
import { InstagramPreview } from "@/components/preview/platforms/InstagramPreview";
import { LinkedInPreview } from "@/components/preview/platforms/LinkedInPreview";
import { ThreadsPreview } from "@/components/preview/platforms/ThreadsPreview";
import { XPreview } from "@/components/preview/platforms/XPreview";
import { YouTubeCommunityPreview } from "@/components/preview/platforms/YouTubeCommunityPreview";
import { parsePreviewContent, type PreviewDevice, type PreviewPlatform } from "@/lib/preview-content";
import { cn } from "@/lib/utils";

const platformLabels: Record<PreviewPlatform, string> = {
  LINKEDIN: "LinkedIn",
  TWITTER: "X",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  THREADS: "Threads",
  COMMUNITY: "YouTube Community",
};

const previewPlatforms: PreviewPlatform[] = [
  "LINKEDIN",
  "TWITTER",
  "INSTAGRAM",
  "FACEBOOK",
  "THREADS",
  "COMMUNITY",
];

export function PlatformPreviewEngine({
  platform,
  draft,
  theme,
  onThemeChange,
}: {
  platform: PreviewPlatform;
  draft: string;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}) {
  const [activePlatform, setActivePlatform] = useState<PreviewPlatform>(platform);
  const [device, setDevice] = useState<PreviewDevice>("iphone");
  const content = useMemo(() => parsePreviewContent(activePlatform, draft), [activePlatform, draft]);

  useEffect(() => {
    setActivePlatform(platform);
  }, [platform]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-300">
              Live preview
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {platformLabels[activePlatform]} · {device}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <DeviceSwitcher value={device} onChange={setDevice} />
            <div className="flex rounded-full border border-white/10 bg-white/[0.06] p-1">
              {(["light", "dark"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onThemeChange(mode)}
                  className={cn(
                    "h-7 rounded-full px-3 text-xs font-medium capitalize text-slate-400 transition",
                    theme === mode && "bg-white text-slate-950",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {previewPlatforms.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActivePlatform(item)}
              className={cn(
                "shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/25 hover:text-white",
                activePlatform === item && "border-primary bg-primary/20 text-white",
              )}
            >
              {platformLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <DevicePreviewShell device={device}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activePlatform}-${theme}-${device}`}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="h-full"
          >
            {activePlatform === "LINKEDIN" ? <LinkedInPreview content={content} dark={theme === "dark"} device={device} /> : null}
            {activePlatform === "TWITTER" ? <XPreview content={content} dark={theme === "dark"} device={device} /> : null}
            {activePlatform === "INSTAGRAM" ? <InstagramPreview content={content} dark={theme === "dark"} device={device} /> : null}
            {activePlatform === "FACEBOOK" ? <FacebookPreview content={content} dark={theme === "dark"} device={device} /> : null}
            {activePlatform === "THREADS" ? <ThreadsPreview content={content} dark={theme === "dark"} device={device} /> : null}
            {activePlatform === "COMMUNITY" ? <YouTubeCommunityPreview content={content} dark={theme === "dark"} device={device} /> : null}
          </motion.div>
        </AnimatePresence>
      </DevicePreviewShell>
    </div>
  );
}
