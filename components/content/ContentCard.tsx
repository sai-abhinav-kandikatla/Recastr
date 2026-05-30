"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContentCardPlatform = "twitter" | "linkedin" | "instagram" | "youtube";

export interface ContentCardProps {
  id: string;
  platform: ContentCardPlatform;
  contentType: string;
  body: string;
  tone: string;
  approved: boolean;
  scheduledAt?: Date;
  order: number;
  onApprove: (id: string) => void;
  onToneChange: (id: string, tone: string) => void;
  onBodyChange: (id: string, body: string) => void;
  onSchedule: (id: string, date: Date) => void;
  onCopy: (id: string) => void;
  onRegenerate: (id: string) => void;
  onActivate?: (id: string) => void;
  selected?: boolean;
}

const tones = ["professional", "casual", "educational", "entertaining"] as const;

const meta: Record<
  ContentCardPlatform,
  { label: string; dot: string; accent: string; limit: number }
> = {
  twitter: { label: "Twitter", dot: "bg-[var(--twitter)]", accent: "border-l-[var(--green-approve)]", limit: 280 },
  linkedin: { label: "LinkedIn", dot: "bg-[var(--linkedin)]", accent: "border-l-[var(--violet)]", limit: 3000 },
  instagram: { label: "Instagram", dot: "bg-[var(--instagram)]", accent: "border-l-[var(--instagram)]", limit: 2200 },
  youtube: { label: "YouTube", dot: "bg-[var(--youtube)]", accent: "border-l-[var(--youtube)]", limit: 500 },
};

const cardEntrance = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: [0.16, 1, 0.32, 1] },
} as const;

export const ContentCard = memo(function ContentCard({
  id,
  platform,
  contentType,
  body,
  tone,
  approved,
  scheduledAt,
  order,
  onApprove,
  onToneChange,
  onBodyChange,
  onSchedule,
  onCopy,
  onRegenerate,
  onActivate,
  selected = false,
}: ContentCardProps) {
  const [localBody, setLocalBody] = useState(body);
  const [focused, setFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState(defaultScheduleValue());
  const [streaming, setStreaming] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const cardMeta = meta[platform];
  const ratio = localBody.length / cardMeta.limit;
  const nearLimit = ratio >= 0.85 && ratio < 1;
  const overLimit = ratio >= 1;
  const showToneStrip = focused || platform === "linkedin";

  useEffect(() => {
    setLocalBody(body);
    if (editorRef.current && editorRef.current.innerText !== body) {
      editorRef.current.innerText = body;
    }
  }, [body]);

  useEffect(() => {
    if (localBody === body) return;
    const timeout = window.setTimeout(() => onBodyChange(id, localBody), 800);
    return () => window.clearTimeout(timeout);
  }, [body, id, localBody, onBodyChange]);

  const scheduledLabel = useMemo(() => {
    if (!scheduledAt) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(scheduledAt);
  }, [scheduledAt]);

  const handleInput = useCallback((event: FormEvent<HTMLDivElement>) => {
    setLocalBody(event.currentTarget.innerText);
  }, []);

  const copy = useCallback(() => {
    onCopy(id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }, [id, onCopy]);

  const regenerate = useCallback(() => {
    setStreaming(true);
    onRegenerate(id);
    window.setTimeout(() => setStreaming(false), 900);
  }, [id, onRegenerate]);

  const changeTone = useCallback(
    (nextTone: string) => {
      setStreaming(true);
      onToneChange(id, nextTone);
      window.setTimeout(() => setStreaming(false), 700);
    },
    [id, onToneChange],
  );

  const saveSchedule = useCallback(() => {
    const date = new Date(scheduleValue);
    if (Number.isNaN(date.getTime())) return;
    onSchedule(id, date);
    setScheduleOpen(false);
  }, [id, onSchedule, scheduleValue]);

  return (
    <motion.article
      {...(order < 8 ? cardEntrance : {})}
      className={cn(
        "group overflow-hidden rounded-[11px] border bg-card text-card-foreground",
        "border-l-[3px]",
        cardMeta.accent,
        focused && "border-[var(--violet)] ring-1 ring-[var(--violet)]/25",
        selected && "ring-1 ring-[var(--violet)]/45",
        scheduledAt && !approved && "border-l-[var(--amber-schedule)]",
      )}
      onClick={() => onActivate?.(id)}
      onFocus={() => {
        setFocused(true);
        onActivate?.(id);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="flex h-[44px] items-center gap-2 border-b px-[18px]">
        <span className={cn("h-2 w-2 rounded-full", cardMeta.dot)} />
        <span className="text-[14px] font-medium text-muted-foreground">{cardMeta.label}</span>
        <button
          type="button"
          onClick={regenerate}
          className="ml-2 hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground transition hover:text-foreground group-hover:flex"
        >
          <RefreshCcw className="h-3 w-3" />
          Regenerate
        </button>
        <div className="ml-auto flex items-center gap-2">
          {scheduledLabel ? (
            <span className="rounded-full border border-[var(--amber-schedule)]/60 bg-[var(--amber-schedule-bg)] px-2 py-0.5 text-[12px] text-[var(--amber-schedule)]">
              {scheduledLabel}
            </span>
          ) : null}
          <span className="rounded-full border px-2 py-0.5 text-[12px] text-muted-foreground">
            {contentType}
          </span>
          {approved ? (
            <span className="rounded-full bg-[var(--green-approve-bg)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--green-approve)]">
              Approved
            </span>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showToneStrip ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 39, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center gap-2 overflow-hidden border-b px-[18px]"
          >
            {tones.map((item) => {
              const active = tone.toLowerCase() === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeTone(item)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[13px] capitalize text-muted-foreground transition hover:text-foreground",
                    active && "border-[var(--violet)] bg-[var(--violet)] text-white hover:text-white",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ opacity: streaming ? 0.48 : 1 }}
        transition={{ duration: 0.25, ease: "easeIn" }}
        className="relative px-[18px] py-5"
      >
        <div
          ref={editorRef}
          aria-label={`${cardMeta.label} content editor`}
          className={cn(
            "min-h-[82px] whitespace-pre-wrap text-[16px] font-medium leading-[1.55] outline-none",
            "selection:bg-[var(--violet)]/20",
            focused && "after:ml-1 after:inline-block after:h-4 after:w-[2px] after:animate-pulse after:bg-[var(--violet)] after:content-['']",
          )}
          contentEditable
          role="textbox"
          suppressContentEditableWarning
          tabIndex={0}
          onInput={handleInput}
        >
          {localBody}
        </div>
        <span
          className={cn(
            "absolute bottom-3 right-5 text-[12px] text-muted-foreground",
            nearLimit && "text-[var(--amber-schedule)]",
            overLimit && "text-red-500",
          )}
        >
          {localBody.length} / {cardMeta.limit}
        </span>
      </motion.div>

      <div className="flex min-h-[62px] items-center justify-between gap-3 border-t px-[18px] py-2">
        <span className="text-[13px] text-muted-foreground">{localBody.length} / {cardMeta.limit}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onApprove(id)}
            className={cn(
              "h-11 rounded-[9px] border px-5 text-[18px] font-medium transition hover:bg-muted",
              approved && "border-[var(--green-approve-bg)] bg-[var(--green-approve-bg)] text-[var(--green-approve)] hover:bg-[var(--green-approve-bg)]",
            )}
          >
            {approved ? <Check className="mr-1 inline h-4 w-4" /> : null}
            {approved ? "Approved" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => setScheduleOpen((current) => !current)}
            className="h-11 rounded-[9px] border px-5 text-[18px] font-medium transition hover:bg-muted"
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={copy}
            className="h-11 rounded-[9px] border px-5 text-[18px] font-medium transition hover:bg-muted"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {scheduleOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden border-t"
          >
            <div className="flex flex-col gap-2 px-[18px] py-3 sm:flex-row sm:items-center">
              <input
                aria-label="Schedule date and time"
                className="h-9 rounded-[7px] border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--violet)]"
                type="datetime-local"
                value={scheduleValue}
                onChange={(event) => setScheduleValue(event.target.value)}
              />
              <button
                type="button"
                onClick={saveSchedule}
                className="inline-flex h-9 items-center gap-1 rounded-[7px] bg-[var(--violet)] px-3 text-sm font-medium text-white"
              >
                Save schedule
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
});

function defaultScheduleValue() {
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
  next.setMinutes(0, 0, 0);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${String(next.getHours()).padStart(2, "0")}:00`;
}
