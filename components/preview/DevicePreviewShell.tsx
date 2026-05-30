"use client";

import { Monitor, Smartphone, TabletSmartphone } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PreviewDevice } from "@/lib/preview-content";

const deviceLabels: Record<PreviewDevice, string> = {
  iphone: "iPhone",
  android: "Android",
  desktop: "Desktop",
};

const deviceIcons: Record<PreviewDevice, ReactNode> = {
  iphone: <Smartphone className="h-3.5 w-3.5" />,
  android: <TabletSmartphone className="h-3.5 w-3.5" />,
  desktop: <Monitor className="h-3.5 w-3.5" />,
};

export function DeviceSwitcher({
  value,
  onChange,
}: {
  value: PreviewDevice;
  onChange: (device: PreviewDevice) => void;
}) {
  return (
    <div className="flex rounded-full border border-white/10 bg-white/[0.06] p-1">
      {(["iphone", "android", "desktop"] as const).map((device) => (
        <button
          key={device}
          type="button"
          onClick={() => onChange(device)}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-slate-400 transition",
            value === device && "bg-white text-slate-950",
          )}
        >
          {deviceIcons[device]}
          <span className="hidden sm:inline">{deviceLabels[device]}</span>
        </button>
      ))}
    </div>
  );
}

export function DevicePreviewShell({
  device,
  children,
}: {
  device: PreviewDevice;
  children: ReactNode;
}) {
  if (device === "desktop") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="mx-auto w-full max-w-[760px] overflow-hidden rounded-[24px] border border-white/10 bg-slate-950 shadow-2xl shadow-black/40"
      >
        <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-slate-900 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-4 h-5 flex-1 rounded-full bg-white/8" />
        </div>
        <div className="h-[560px] overflow-hidden bg-white">{children}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn("relative mx-auto w-full", device === "iphone" ? "max-w-[360px]" : "max-w-[348px]")}
    >
      {device === "iphone" ? <div className="absolute -left-1 top-28 h-14 w-1 rounded-l-full bg-slate-700" /> : null}
      {device === "iphone" ? <div className="absolute -right-1 top-36 h-20 w-1 rounded-r-full bg-slate-700" /> : null}
      <div
        className={cn(
          "bg-slate-950 p-2 shadow-2xl shadow-black/50 ring-1 ring-white/15",
          device === "iphone" ? "rounded-[46px]" : "rounded-[34px]",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-black p-2 ring-1 ring-white/10",
            device === "iphone" ? "rounded-[38px]" : "rounded-[27px]",
          )}
        >
          {device === "iphone" ? (
            <div className="absolute left-1/2 top-3 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-black shadow-lg ring-1 ring-white/10" />
          ) : (
            <div className="absolute left-1/2 top-4 z-20 h-3 w-3 -translate-x-1/2 rounded-full bg-black shadow-lg ring-1 ring-white/10" />
          )}
          <div
            className={cn(
              "overflow-hidden bg-white",
              device === "iphone" ? "h-[680px] rounded-[31px]" : "h-[660px] rounded-[22px]",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
