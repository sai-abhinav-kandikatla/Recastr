"use client";

import { useMemo, useState } from "react";
import { Diff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, wordCount } from "@/lib/utils";

export function InlineEditor({
  value,
  originalValue,
  limit,
  onChange,
}: {
  value: string;
  originalValue: string;
  limit?: number;
  onChange: (value: string) => void;
}) {
  const [showDiff, setShowDiff] = useState(false);
  const diff = useMemo(() => {
    const originalWords = new Set(originalValue.split(/\s+/));
    return value.split(/(\s+)/).map((word, index) =>
      word.trim() && !originalWords.has(word) ? (
        <mark key={`${word}-${index}`} className="rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          {word}
        </mark>
      ) : (
        <span key={`${word}-${index}`}>{word}</span>
      ),
    );
  }, [originalValue, value]);
  const isOverLimit = Boolean(limit && value.length > limit);

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "min-h-[320px] resize-y font-mono text-sm leading-7",
          isOverLimit && "border-red-500 focus-visible:ring-red-500",
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex gap-3">
          <span>{value.length} chars</span>
          <span>{wordCount(value)} words</span>
          {limit ? <span className={cn(isOverLimit && "text-red-500")}>limit {limit}</span> : null}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowDiff((current) => !current)}>
          <Diff className="h-3.5 w-3.5" />
          Diff view
        </Button>
      </div>
      {showDiff ? <div className="rounded-[12px] border bg-muted/30 p-4 text-sm leading-7">{diff}</div> : null}
    </div>
  );
}
