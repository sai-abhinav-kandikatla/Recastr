"use client";

import type { ReactNode } from "react";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Quote,
  Repeat2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewContent, PreviewDevice } from "@/lib/preview-content";

export function ThreadsPreview({
  content,
  dark,
  device,
}: {
  content: PreviewContent;
  dark: boolean;
  device: PreviewDevice;
}) {
  const desktop = device === "desktop";
  const chain = normalizeThreads(content).slice(0, desktop ? 6 : 5);
  const quote = content.hook && content.hook !== chain[0] ? content.hook : "";

  return (
    <div className={cn("h-full overflow-y-auto font-sans", dark ? "bg-black text-[#f5f5f5]" : "bg-white text-[#101010]")}>
      <div className={cn("mx-auto", desktop ? "max-w-[620px] py-8" : "px-4 pb-6 pt-10")}>
        <header className="sticky top-0 z-10 mb-5 flex h-12 items-center justify-center bg-inherit">
          <p className="text-[16px] font-semibold">Threads</p>
        </header>

        <div>
          {chain.map((item, index) => (
            <article key={`${item}-${index}`} className="relative flex gap-3 pb-6">
              {index < chain.length - 1 ? (
                <div className={cn("absolute left-5 top-12 h-[calc(100%-18px)] w-0.5", dark ? "bg-[#333333]" : "bg-[#d9d9d9]")} />
              ) : null}
              <ThreadsAvatar small={index > 0} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-1">
                    <p className="truncate text-[14px] font-semibold">recastr.studio</p>
                    <BadgeCheck className="h-4 w-4 fill-[#0095f6] text-white" />
                    <span className="text-[13px] text-[#777777]">{index === 0 ? "2h" : `${index + 2}m`}</span>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-[#777777]" />
                </div>

                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-5">{item}</p>
                {index === 0 && quote ? <ThreadsQuote text={quote} dark={dark} /> : null}
                {index === 1 && content.mediaType === "carousel" ? <ThreadsMedia slides={content.carouselSlides} dark={dark} /> : null}

                <div className="mt-3 flex gap-5 text-[#777777]">
                  <ThreadsIcon icon={<Heart className="h-[18px] w-[18px]" />} label="Like thread" />
                  <ThreadsIcon icon={<MessageCircle className="h-[18px] w-[18px]" />} label="Reply" />
                  <ThreadsIcon icon={<Repeat2 className="h-[18px] w-[18px]" />} label="Repost" />
                  <ThreadsIcon icon={<Send className="h-[18px] w-[18px]" />} label="Share" />
                </div>
                <p className="mt-3 text-[13px] text-[#777777]">
                  {index === 0 ? "428 replies - 3.7K likes" : `${42 + index * 7} replies - ${310 + index * 80} likes`}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadsAvatar({ small }: { small: boolean }) {
  return (
    <div className={cn("relative shrink-0", small ? "h-9 w-9" : "h-10 w-10")}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[#111111] text-[14px] font-bold text-white ring-1 ring-white/10">
        R
      </div>
      {!small ? (
        <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-white text-[13px] text-black dark:border-black">
          +
        </div>
      ) : null}
    </div>
  );
}

function ThreadsQuote({ text, dark }: { text: string; dark: boolean }) {
  return (
    <div className={cn("mt-3 rounded-2xl border p-3", dark ? "border-[#333333]" : "border-[#d9d9d9]")}>
      <div className="flex items-center gap-2 text-[13px] font-semibold">
        <Quote className="h-4 w-4" />
        Quoted thread
      </div>
      <p className="mt-2 line-clamp-3 text-[14px] leading-5">{text}</p>
    </div>
  );
}

function ThreadsMedia({ slides, dark }: { slides: string[]; dark: boolean }) {
  const first = slides[0] || "Content system";
  return (
    <div className={cn("mt-3 aspect-[1.7] overflow-hidden rounded-2xl border p-4", dark ? "border-[#333333] bg-[#111111]" : "border-[#d9d9d9] bg-[#f5f5f5]")}>
      <div className="flex h-full items-end rounded-xl bg-black/10 p-4">
        <p className="text-[20px] font-semibold leading-tight">{first}</p>
      </div>
    </div>
  );
}

function ThreadsIcon({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button aria-label={label} className="transition hover:text-current" type="button">
      {icon}
    </button>
  );
}

function normalizeThreads(content: PreviewContent) {
  if (content.thread.length) return content.thread;
  const parts = content.primaryText
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts.slice(0, 6) : [content.primaryText];
}
