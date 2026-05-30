"use client";

import { cn } from "@/lib/utils";

export function PreviewAvatar({
  tone,
  size = "md",
}: {
  tone: "blue" | "sky" | "pink" | "red" | "black" | "violet";
  size?: "sm" | "md" | "lg";
}) {
  const gradient = {
    blue: "from-blue-600 to-cyan-400",
    sky: "from-sky-400 to-teal-400",
    pink: "from-pink-500 to-amber-400",
    red: "from-red-500 to-violet-electric",
    black: "from-zinc-900 to-zinc-500",
    violet: "from-violet-electric to-teal-400",
  }[tone];
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }[size];

  return <div className={cn("shrink-0 rounded-full bg-gradient-to-br", gradient, sizes)} />;
}

export function PreviewMedia({
  label,
  variant = "image",
  className,
}: {
  label: string;
  variant?: "image" | "video" | "carousel" | "short";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-violet-electric via-sky-500 to-teal-400 text-white",
        variant === "video" ? "aspect-[9/16]" : "aspect-square",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.32),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(160deg,rgba(0,0,0,0.04),rgba(0,0,0,0.38))]" />
      <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/30 p-4 backdrop-blur-md">
        <p className="text-pretty text-lg font-medium leading-tight">{label}</p>
      </div>
      {variant === "carousel" ? (
        <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium">
          1/5
        </div>
      ) : null}
    </div>
  );
}

export function clampText(text: string, max = 260) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}
