"use client";

import type { ReactNode } from "react";
import { Bookmark, Heart, MessageCircle, Music2, Plus, Search, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewContent, PreviewDevice } from "@/lib/preview-content";
import { PreviewAvatar } from "@/components/preview/preview-utils";

export function TikTokPreview({
  content,
  dark,
  device,
}: {
  content: PreviewContent;
  dark: boolean;
  device: PreviewDevice;
}) {
  const desktop = device === "desktop";

  return (
    <div className={cn("relative h-full overflow-hidden", dark ? "bg-black text-white" : "bg-[#f8f8f8] text-white")}>
      <div className={cn("mx-auto h-full overflow-hidden bg-black", desktop ? "max-w-[390px]" : "w-full")}>
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 text-sm font-medium">
          <span className="opacity-70">Following</span>
          <span>For You</span>
          <Search className="h-5 w-5" />
        </div>

        <div className="relative flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.42),transparent_30%),linear-gradient(160deg,#111827,#020617)] px-6 text-center">
          <div className="max-w-[260px]">
            <p className="text-2xl font-medium leading-tight">{content.hook}</p>
            <p className="mt-4 line-clamp-5 text-sm leading-6 text-white/78">{content.primaryText}</p>
          </div>
        </div>

        <div className="absolute bottom-5 left-4 right-20 z-10">
          <p className="text-sm font-medium">@recastr.studio</p>
          <p className="mt-2 line-clamp-3 text-sm leading-5">{content.primaryText}</p>
          <p className="mt-2 text-xs text-white/80">{content.hashtags.join(" ")}</p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Music2 className="h-4 w-4" />
            <span className="truncate">Original sound - Recastr Studio</span>
          </div>
        </div>

        <div className="absolute bottom-7 right-3 z-10 flex flex-col items-center gap-5">
          <div className="relative">
            <PreviewAvatar tone="pink" />
            <span className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-[#fe2c55]">
              <Plus className="h-3 w-3" />
            </span>
          </div>
          <Action icon={<Heart className="h-7 w-7 fill-white" />} label="82.4K" />
          <Action icon={<MessageCircle className="h-7 w-7 fill-white" />} label="1,248" />
          <Action icon={<Bookmark className="h-7 w-7 fill-white" />} label="9,812" />
          <Action icon={<Share className="h-7 w-7" />} label="Share" />
          <div className="h-10 w-10 rounded-full border border-white/30 bg-[conic-gradient(from_20deg,#111,#555,#111)]" />
        </div>
      </div>
    </div>
  );
}

function Action({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-[11px] font-medium">
      {icon}
      <span>{label}</span>
    </div>
  );
}
