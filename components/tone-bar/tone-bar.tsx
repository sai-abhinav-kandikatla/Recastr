"use client";

import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useRecastrStore } from "@/lib/store";
import type { Tone } from "@/lib/types";

const tones: Tone[] = [
  "Professional",
  "Casual",
  "Witty",
  "Bold",
  "Empathetic",
  "Educational",
  "Controversial",
  "Storytelling",
];

export function ToneBar({
  blend,
  setBlend,
  fromTone,
  setFromTone,
  toTone,
  setToTone,
  onApply,
}: {
  blend: number;
  setBlend: (value: number) => void;
  fromTone: Tone;
  setFromTone: (tone: Tone) => void;
  toTone: Tone;
  setToTone: (tone: Tone) => void;
  onApply: () => void;
}) {
  const setSelectedTone = useRecastrStore((state) => state.setSelectedTone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      className="flex flex-col gap-3 rounded-[12px] border bg-card p-3 shadow-soft lg:flex-row lg:items-center"
    >
      <div className="text-sm font-medium lg:w-24">Tone</div>
      <div className="grid flex-1 gap-3 sm:grid-cols-[150px_1fr_150px] sm:items-center">
        <Select
          value={fromTone}
          onChange={(event) => setFromTone(event.target.value as Tone)}
          aria-label="From tone"
        >
          {tones.map((tone) => (
            <option key={tone}>{tone}</option>
          ))}
        </Select>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">0</span>
          <input
            type="range"
            min="0"
            max="100"
            value={blend}
            onChange={(event) => setBlend(Number(event.target.value))}
            className="h-2 w-full accent-primary"
            aria-label="Tone blend"
          />
          <span className="text-xs text-muted-foreground">100</span>
        </div>
        <Select
          value={toTone}
          onChange={(event) => {
            const nextTone = event.target.value as Tone;
            setToTone(nextTone);
            setSelectedTone(nextTone);
          }}
          aria-label="To tone"
        >
          {tones.map((tone) => (
            <option key={tone}>{tone}</option>
          ))}
        </Select>
      </div>
      <Button onClick={onApply} className="self-start lg:self-auto">
        <Wand2 className="h-4 w-4" />
        Match my brand voice
      </Button>
    </motion.div>
  );
}
