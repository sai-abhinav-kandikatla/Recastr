"use client";

import {
  BarChart3,
  Bell,
  MessageCircle,
  MoreVertical,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewContent, PreviewDevice } from "@/lib/preview-content";

export function YouTubeCommunityPreview({
  content,
  dark,
  device,
}: {
  content: PreviewContent;
  dark: boolean;
  device: PreviewDevice;
}) {
  const desktop = device === "desktop";
  const hasPoll = content.pollOptions.length > 1;

  return (
    <div className={cn("h-full overflow-y-auto font-sans", dark ? "bg-[#0f0f0f] text-white" : "bg-white text-[#0f0f0f]")}>
      <div className={cn("mx-auto", desktop ? "max-w-[690px] py-8" : "px-3 pb-6 pt-9")}>
        <section className={cn("overflow-hidden rounded-2xl border", dark ? "border-[#303030] bg-[#181818]" : "border-[#e5e5e5] bg-white")}>
          <header className="flex items-center gap-3 p-4">
            <YouTubeAvatar />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[14px] font-semibold">Recastr Studio</p>
                <span className="rounded-sm bg-[#cc0000] px-1.5 py-0.5 text-[10px] font-bold text-white">SUBSCRIBE</span>
              </div>
              <p className="text-[12px] text-[#606060] dark:text-[#aaa]">Community - 2 hours ago</p>
            </div>
            <button aria-label="More YouTube community actions" className="rounded-full p-2 text-[#606060] hover:bg-black/5 dark:text-[#aaa] dark:hover:bg-white/10" type="button">
              <MoreVertical className="h-5 w-5" />
            </button>
          </header>

          <div className="px-4 pb-4">
            <p className="whitespace-pre-wrap text-[14px] leading-5">{content.primaryText}</p>
          </div>

          {hasPoll ? (
            <YouTubePoll question={content.pollQuestion} options={content.pollOptions} dark={dark} />
          ) : (
            <YouTubeImagePost content={content} dark={dark} />
          )}

          <div className="flex items-center gap-4 border-t border-[#e5e5e5] px-4 py-3 text-[13px] text-[#606060] dark:border-[#303030] dark:text-[#aaa]">
            <button className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" type="button">
              <ThumbsUp className="h-[18px] w-[18px]" />
              3.2K
            </button>
            <button className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10" type="button" aria-label="Dislike">
              <ThumbsDown className="h-[18px] w-[18px]" />
            </button>
            <button className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" type="button">
              <MessageCircle className="h-[18px] w-[18px]" />
              219
            </button>
            <button className="ml-auto rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10" type="button" aria-label="Share community post">
              <Share2 className="h-[18px] w-[18px]" />
            </button>
          </div>
        </section>

        {desktop ? (
          <aside className={cn("mt-4 rounded-2xl border p-4", dark ? "border-[#303030] bg-[#181818]" : "border-[#e5e5e5] bg-white")}>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-[#cc0000]" />
              <div>
                <p className="text-[14px] font-semibold">Channel branding preview</p>
                <p className="text-[12px] text-[#606060] dark:text-[#aaa]">1.2M subscribers - creator education</p>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function YouTubeAvatar() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#cc0000] text-[15px] font-bold text-white">
      R
    </div>
  );
}

function YouTubePoll({ question, options, dark }: { question: string; options: string[]; dark: boolean }) {
  return (
    <div className="px-4 pb-4">
      {question ? <p className="mb-3 text-[13px] font-semibold">{question}</p> : null}
      <div className="space-y-2">
        {options.slice(0, 4).map((option, index) => (
          <div key={option} className={cn("overflow-hidden rounded-full border", dark ? "border-[#3f3f3f]" : "border-[#d9d9d9]")}>
            <div className="relative h-10">
              <span className="absolute inset-y-0 left-0 bg-[#3ea6ff]/25" style={{ width: `${[45, 27, 19, 9][index] ?? 12}%` }} />
              <span className="relative flex h-full items-center justify-between px-4 text-[13px] font-semibold">
                <span>{option}</span>
                <span>{[45, 27, 19, 9][index] ?? 12}%</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1 text-[12px] text-[#606060] dark:text-[#aaa]">
        <BarChart3 className="h-3.5 w-3.5" />
        18K votes
      </p>
    </div>
  );
}

function YouTubeImagePost({ content, dark }: { content: PreviewContent; dark: boolean }) {
  return (
    <div className="px-4 pb-4">
      <div className={cn("aspect-[16/9] overflow-hidden rounded-xl border", dark ? "border-[#303030] bg-[#202020]" : "border-[#e5e5e5] bg-[#f8f8f8]")}>
        <div className="grid h-full place-items-center p-6 text-center">
          <div>
            <p className="text-[28px] font-bold leading-[1.05]">{content.hook || "Which asset should we make from this source?"}</p>
            <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-[#606060] dark:text-[#aaa]">Community image</p>
          </div>
        </div>
      </div>
    </div>
  );
}
