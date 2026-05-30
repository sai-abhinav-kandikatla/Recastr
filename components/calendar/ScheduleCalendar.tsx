"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Platform, ScheduledPost } from "@/lib/types";

type ViewMode = "month" | "week" | "day";

export function ScheduleCalendar({ scheduledPosts }: { scheduledPosts: ScheduledPost[] }) {
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [posts, setPosts] = useState(scheduledPosts);
  const visibleDays = useMemo(() => getVisibleDays(cursor, view), [cursor, view]);
  const queue = useMemo(
    () => posts.filter((post) => !["SCHEDULED", "PENDING"].includes(post.status)),
    [posts],
  );

  function move(direction: "prev" | "next") {
    setCursor((current) => {
      if (view === "month") return direction === "next" ? addMonths(current, 1) : subMonths(current, 1);
      if (view === "week") return direction === "next" ? addWeeks(current, 1) : subWeeks(current, 1);
      return new Date(current.getTime() + (direction === "next" ? 1 : -1) * 24 * 60 * 60 * 1000);
    });
  }

  function autoSchedule() {
    const start = new Date();
    setPosts((current) =>
      current.map((post, index) => {
        if (["SCHEDULED", "PENDING"].includes(post.status)) return post;
        const next = new Date(start.getTime() + (index + 1) * 24 * 60 * 60 * 1000);
        next.setHours([9, 12, 18][index % 3] ?? 9, 0, 0, 0);
        return { ...post, status: "SCHEDULED", publishAt: next.toISOString(), scheduledAt: next.toISOString() };
      }),
    );
    toast.success("Auto-schedule preview applied");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-medium">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(cursor, "MMMM yyyy")} · plan posts without clutter.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => move("prev")} size="sm" variant="secondary">
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button onClick={() => setCursor(new Date())} size="sm" variant="secondary">Today</Button>
          <Button onClick={() => move("next")} size="sm" variant="secondary">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={autoSchedule} size="sm">
            <Shuffle className="h-4 w-4" />
            Auto-schedule
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 rounded-2xl border bg-card p-2">
        <div className="flex gap-2">
          {(["month", "week", "day"] as const).map((option) => (
            <button
              className={cn(
                "h-9 rounded-lg px-4 text-sm font-medium capitalize text-muted-foreground transition",
                view === option && "bg-[var(--violet)] text-white",
              )}
              key={option}
              onClick={() => setView(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary">
          <CalendarPlus className="h-4 w-4" />
          Add to calendar
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div className="px-2 py-3" key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {visibleDays.map((day) => {
              const dayPosts = posts.filter((post) => isSameDay(new Date(post.publishAt), day) && ["SCHEDULED", "PENDING"].includes(post.status));
              return (
                <button
                  className={cn(
                    "min-h-32 border-b border-r p-2 text-left transition hover:bg-muted/40",
                    !isSameMonth(day, cursor) && view === "month" && "bg-muted/20 text-muted-foreground",
                    isSameDay(day, new Date()) && "bg-[var(--violet-light)]/45",
                  )}
                  key={day.toISOString()}
                  onClick={() => toast.info(`Schedule to ${format(day, "MMM d")}`)}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium", isSameDay(day, new Date()) && "text-[var(--violet)]")}>
                      {format(day, "d")}
                    </span>
                    <span className="opacity-0 transition group-hover:opacity-100">+</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div className="truncate rounded-full border bg-background px-2 py-1 text-[11px]" key={post.id}>
                        <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", platformClass(post.platform))} />
                        {platformLabel(post.platform)} · {post.title}
                      </div>
                    ))}
                    {dayPosts.length > 3 ? (
                      <p className="text-[11px] text-muted-foreground">More +{dayPosts.length - 3}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="max-h-[calc(100vh-14rem)] overflow-y-auto rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Unscheduled queue</p>
            <Badge variant="muted">{queue.length}</Badge>
          </div>
          <div className="mt-4 space-y-2">
            {queue.length ? (
              queue.map((post) => (
                <div className="rounded-xl border bg-muted/30 p-3" key={post.id}>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={cn("h-2 w-2 rounded-full", platformClass(post.platform))} />
                    {platformLabel(post.platform)}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{post.title}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                Approved posts waiting for dates will appear here.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function getVisibleDays(cursor: Date, view: ViewMode) {
  if (view === "day") return [cursor];
  if (view === "week") {
    return eachDayOfInterval({
      start: startOfWeek(cursor),
      end: endOfWeek(cursor),
    });
  }
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor)),
    end: endOfWeek(endOfMonth(cursor)),
  });
}

function platformClass(platform: Platform) {
  if (platform === "TWITTER") return "bg-[var(--twitter)]";
  if (platform === "LINKEDIN") return "bg-[var(--linkedin)]";
  if (platform === "INSTAGRAM" || platform === "CAROUSEL" || platform === "STORY") return "bg-[var(--instagram)]";
  return "bg-[var(--youtube)]";
}

function platformLabel(platform: Platform) {
  if (platform === "TWITTER") return "Twitter";
  if (platform === "LINKEDIN") return "LinkedIn";
  if (platform === "INSTAGRAM" || platform === "CAROUSEL" || platform === "STORY") return "Instagram";
  return "YouTube";
}
