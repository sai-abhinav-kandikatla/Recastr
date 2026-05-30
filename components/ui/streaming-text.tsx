"use client";

import { motion } from "framer-motion";

export function StreamingText({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border bg-slate-950 p-4 font-mono text-sm leading-7 text-violet-100">
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {text}
      </motion.span>
      <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-violet-300 align-middle" />
    </div>
  );
}
