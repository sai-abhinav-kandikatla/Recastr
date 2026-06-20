"use client";

import { cn } from "@/lib/utils";

type PlatformIconProps = {
  platform: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "square" | "circle";
  style?: React.CSSProperties;
};

export function PlatformIcon({
  platform,
  className = "",
  size = "md",
  variant = "square",
  style,
}: PlatformIconProps) {
  const p = platform.toUpperCase();

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size];

  const svgSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-5 w-5",
  }[size];

  const variantClass = variant === "circle" ? "rounded-full" : "rounded-[6px]";

  if (p === "TWITTER" || p === "X") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-black text-white border border-zinc-800 shrink-0",
          sizeClasses,
          variantClass,
          className
        )}
        style={style}
      >
        <svg viewBox="0 0 24 24" className={cn("fill-current", svgSizes)}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    );
  }
  if (p === "LINKEDIN") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#0A66C2] text-white shrink-0",
          sizeClasses,
          variantClass,
          className
        )}
        style={style}
      >
        <svg viewBox="0 0 24 24" className={cn("fill-current", svgSizes)}>
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      </div>
    );
  }
  if (p === "INSTAGRAM" || p === "CAROUSEL" || p === "STORY") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shrink-0",
          sizeClasses,
          variantClass,
          className
        )}
        style={style}
      >
        <svg
          viewBox="0 0 24 24"
          className={cn("fill-none stroke-current", svgSizes)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </div>
    );
  }
  if (p === "FACEBOOK") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#1877F2] text-white shrink-0",
          sizeClasses,
          variantClass,
          className
        )}
        style={style}
      >
        <svg viewBox="0 0 24 24" className={cn("fill-current", svgSizes)}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  }
  if (p === "THREADS") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-black text-white border border-zinc-800 shrink-0",
          sizeClasses,
          variantClass,
          className
        )}
        style={style}
      >
        <svg viewBox="0 0 24 24" className={cn("fill-current", svgSizes)}>
          <path d="M12.502 17.5c1.782 0 3.258-1.258 3.465-2.923.639.467 1.428.723 2.235.723 1.63 0 2.8-1.07 2.8-2.8v-1C21 7.215 16.785 3 12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c2.122 0 4.07-.736 5.617-1.968l-1.013-1.127C15.343 18.995 13.738 19.5 12 19.5c-4.143 0-7.5-3.357-7.5-7.5s3.357-7.5 7.5-7.5 7.5 3.357 7.5 7.5v1c0 1.045-.555 1.7-1.3 1.7-.551 0-.9-.335-.9-.97v-4.13c0-2.26-1.54-3.6-3.8-3.6h-2C7.24 7.5 5.5 9.24 5.5 11.5v2c0 2.193 1.807 4 4 4h2z" />
        </svg>
      </div>
    );
  }
  // YOUTUBE or COMMUNITY
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[#FF0000] text-white shrink-0",
        sizeClasses,
        variantClass,
        className
      )}
      style={style}
    >
      <svg viewBox="0 0 24 24" className={cn("fill-current", svgSizes)}>
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.002 3.002 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.002 3.002 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </div>
  );
}
