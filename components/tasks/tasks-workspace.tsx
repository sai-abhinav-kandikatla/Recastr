"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, isThisWeek, isToday } from "date-fns";
import { CalendarClock, CheckCircle2, Clock3, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentPiece, Platform, Project, ScheduledPost } from "@/lib/types";

type TaskTab = "queue" | "scheduled" | "history";
type ScheduledFilter = "upcoming" | "today" | "week" | "all";

export function TasksWorkspace({
  projects,
  scheduledPosts,
}: {
  projects: Project[];
  scheduledPosts: ScheduledPost[];
}) {
  const [tab, setTab] = useState<TaskTab>("queue");
  const [scheduledFilter, setScheduledFilter] = useState<ScheduledFilter>("upcoming");
  const [localScheduled, setLocalScheduled] = useState(scheduledPosts);
  const contentIndex = useMemo(() => buildContentIndex(projects), [projects]);
  const scheduledContentIds = useMemo(
    () => new Set(localScheduled.map((post) => post.contentId).filter(Boolean)),
    [localScheduled],
  );
  const queueItems = useMemo(
    () =>
      projects.flatMap((project) =>
        (project.contents ?? [])
          .filter((content) => content.approved && !scheduledContentIds.has(content.id))
          .map((content) => ({ content, project })),
      ),
    [projects, scheduledContentIds],
  );
  const scheduledItems = useMemo(
    () =>
      localScheduled
        .filter((post) => ["SCHEDULED", "PENDING"].includes(post.status))
        .filter((post) => matchesScheduledFilter(post, scheduledFilter))
        .sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()),
    [localScheduled, scheduledFilter],
  );
  const historyItems = useMemo(
    () =>
      localScheduled
        .filter((post) => ["PUBLISHED", "FAILED", "CANCELLED"].includes(post.status))
        .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime()),
    [localScheduled],
  );

  function scheduleQueued(content: ContentPiece, project: Project, date: Date) {
    const post: ScheduledPost = {
      id: `local-scheduled-${Date.now()}`,
      outputId: content.id,
      contentId: content.id,
      platform: content.platform,
      publishAt: date.toISOString(),
      scheduledAt: date.toISOString(),
      status: "SCHEDULED",
      title: project.title,
    };
    setLocalScheduled((current) => [...current, post]);
    toast.success("Post scheduled");
  }

  function cancelScheduled(id: string) {
    setLocalScheduled((current) =>
      current.map((post) => (post.id === id ? { ...post, status: "CANCELLED" } : post)),
    );
    toast.success("Post unscheduled");
  }

  function retryPost(id: string) {
    setLocalScheduled((current) =>
      current.map((post) => (post.id === id ? { ...post, status: "SCHEDULED", failReason: null } : post)),
    );
    toast.success("Retry queued");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Tasks & Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your scheduled posts, content queue, and publishing history.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2">
        {(["queue", "scheduled", "history"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "h-9 rounded-lg px-4 text-sm font-medium capitalize text-muted-foreground transition",
              tab === item && "bg-[var(--violet)] text-white",
            )}
          >
            {item === "queue" ? "Queue" : item}
          </button>
        ))}
      </div>

      {tab === "queue" ? (
        <QueueTab items={queueItems} onSchedule={scheduleQueued} />
      ) : null}

      {tab === "scheduled" ? (
        <ScheduledTab
          contentIndex={contentIndex}
          filter={scheduledFilter}
          posts={scheduledItems}
          onCancel={cancelScheduled}
          onFilterChange={setScheduledFilter}
        />
      ) : null}

      {tab === "history" ? (
        <HistoryTab
          contentIndex={contentIndex}
          posts={historyItems}
          onDelete={(id) => setLocalScheduled((current) => current.filter((post) => post.id !== id))}
          onRetry={retryPost}
        />
      ) : null}
    </div>
  );
}

function QueueTab({
  items,
  onSchedule,
}: {
  items: Array<{ content: ContentPiece; project: Project }>;
  onSchedule: (content: ContentPiece, project: Project, date: Date) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        actionHref="/projects/demo-founder-podcast"
        actionLabel="Open a project"
        headline="No approved content yet"
        icon={<CheckCircle2 className="h-10 w-10 text-muted-foreground" />}
        subline="Approve content inside a project to move it into your scheduling queue."
      />
    );
  }

  return (
    <section className="space-y-3">
      <p className="text-sm text-muted-foreground">Approved content waiting to be scheduled.</p>
      {items.map(({ content, project }) => (
        <QueueCard
          content={content}
          key={content.id}
          onSchedule={(date) => onSchedule(content, project, date)}
          project={project}
        />
      ))}
    </section>
  );
}

function QueueCard({
  content,
  project,
  onSchedule,
}: {
  content: ContentPiece;
  project: Project;
  onSchedule: (date: Date) => void;
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [dateValue, setDateValue] = useState(defaultScheduleValue());

  return (
    <article className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <PlatformDot platform={content.platform} />
        <span className="text-sm font-medium">{platformLabel(content.platform)}</span>
        <Badge variant="muted">{content.contentType}</Badge>
        <span className="text-xs text-muted-foreground">From: {project.title}</span>
      </div>
      <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6">{truncate(content.body, 220)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setScheduleOpen((current) => !current)} size="sm">
          <CalendarClock className="h-4 w-4" />
          Schedule this
        </Button>
        <Button
          onClick={() => {
            void navigator.clipboard.writeText(content.body);
            toast.success("Copied to clipboard");
          }}
          size="sm"
          variant="secondary"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <Button size="sm" variant="ghost">
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
      {scheduleOpen ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center">
          <input
            aria-label="Schedule date and time"
            className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--violet)]"
            type="datetime-local"
            value={dateValue}
            onChange={(event) => setDateValue(event.target.value)}
          />
          <Button
            onClick={() => {
              onSchedule(new Date(dateValue));
              setScheduleOpen(false);
            }}
            size="sm"
          >
            Confirm schedule
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function ScheduledTab({
  contentIndex,
  filter,
  posts,
  onCancel,
  onFilterChange,
}: {
  contentIndex: Map<string, ContentPiece>;
  filter: ScheduledFilter;
  posts: ScheduledPost[];
  onCancel: (id: string) => void;
  onFilterChange: (filter: ScheduledFilter) => void;
}) {
  const grouped = groupByDay(posts);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Posts scheduled to go out.</p>
        <div className="flex flex-wrap gap-2">
          {(["upcoming", "today", "week", "all"] as const).map((item) => (
            <button
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground",
                filter === item && "border-[var(--violet)] bg-[var(--violet)] text-white",
              )}
              key={item}
              onClick={() => onFilterChange(item)}
              type="button"
            >
              {item === "week" ? "This week" : item}
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          headline="Nothing scheduled yet"
          icon={<Clock3 className="h-10 w-10 text-muted-foreground" />}
          subline="Head to Queue and schedule approved content."
        />
      ) : (
        Object.entries(grouped).map(([day, dayPosts]) => (
          <div className="rounded-2xl border bg-card" key={day}>
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">{day}</p>
            </div>
            <div className="divide-y">
              {dayPosts.map((post) => {
                const content = post.contentId ? contentIndex.get(post.contentId) : undefined;
                return (
                  <div className="grid gap-3 px-4 py-3 md:grid-cols-[82px_150px_1fr_auto] md:items-center" key={post.id}>
                    <span className="font-mono text-xs text-muted-foreground">
                      {format(new Date(post.publishAt), "h:mma")}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <PlatformDot platform={post.platform} />
                      {platformLabel(post.platform)}
                    </span>
                    <p className="truncate text-sm text-muted-foreground">
                      {content ? truncate(content.body, 90) : post.title}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary">Edit</Button>
                      <Button onClick={() => onCancel(post.id)} size="sm" variant="ghost">Cancel</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function HistoryTab({
  contentIndex,
  posts,
  onDelete,
  onRetry,
}: {
  contentIndex: Map<string, ContentPiece>;
  posts: ScheduledPost[];
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        headline="No publishing history yet"
        icon={<Clock3 className="h-10 w-10 text-muted-foreground" />}
        subline="Published, failed, and cancelled posts will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="grid grid-cols-[150px_120px_1fr_110px_130px] gap-3 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
        <span>Date & time</span>
        <span>Platform</span>
        <span>Content preview</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {posts.map((post) => {
        const content = post.contentId ? contentIndex.get(post.contentId) : undefined;
        return (
          <div className="grid grid-cols-[150px_120px_1fr_110px_130px] gap-3 border-b px-4 py-3 text-sm last:border-b-0" key={post.id}>
            <span className="font-mono text-xs text-muted-foreground">{format(new Date(post.publishAt), "MMM d, h:mma")}</span>
            <span className="flex items-center gap-2">
              <PlatformDot platform={post.platform} />
              {platformLabel(post.platform)}
            </span>
            <span className="truncate text-muted-foreground">{content ? truncate(content.body, 88) : post.title}</span>
            <StatusBadge status={post.status} />
            <span className="flex gap-2">
              {post.status === "FAILED" ? (
                <button className="text-[var(--violet)]" onClick={() => onRetry(post.id)} type="button">
                  Retry
                </button>
              ) : (
                <button className="text-muted-foreground" type="button">View</button>
              )}
              <button className="text-muted-foreground" onClick={() => onDelete(post.id)} type="button">
                Delete
              </button>
            </span>
          </div>
        );
      })}
      <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
        <span>Showing {posts.length} rows</span>
        <div className="flex gap-2">
          <Button disabled size="sm" variant="secondary">Previous</Button>
          <Button disabled size="sm" variant="secondary">Next</Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  actionHref,
  actionLabel,
  headline,
  icon,
  subline,
}: {
  actionHref?: string;
  actionLabel?: string;
  headline: string;
  icon: ReactNode;
  subline: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">{icon}</div>
      <h2 className="mt-5 text-lg font-medium">{headline}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{subline}</p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-5">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: ScheduledPost["status"] }) {
  if (status === "PUBLISHED") return <Badge variant="success">Published</Badge>;
  if (status === "FAILED") return <Badge variant="danger">Failed</Badge>;
  if (status === "CANCELLED") return <Badge variant="muted">Cancelled</Badge>;
  return <Badge variant="warning">Scheduled</Badge>;
}

function PlatformDot({ platform }: { platform: Platform }) {
  return <span className={cn("h-2 w-2 rounded-full", platformClass(platform))} />;
}

function platformClass(platform: Platform) {
  if (platform === "TWITTER") return "bg-[var(--twitter)]";
  if (platform === "LINKEDIN") return "bg-[var(--linkedin)]";
  if (platform === "INSTAGRAM" || platform === "CAROUSEL" || platform === "STORY") return "bg-[var(--instagram)]";
  return "bg-[var(--youtube)]";
}

function platformLabel(platform: Platform) {
  if (platform === "TWITTER") return "Twitter / X";
  if (platform === "LINKEDIN") return "LinkedIn";
  if (platform === "INSTAGRAM" || platform === "CAROUSEL" || platform === "STORY") return "Instagram";
  return "YouTube Shorts";
}

function buildContentIndex(projects: Project[]) {
  const map = new Map<string, ContentPiece>();
  for (const project of projects) {
    for (const content of project.contents ?? []) map.set(content.id, content);
  }
  return map;
}

function matchesScheduledFilter(post: ScheduledPost, filter: ScheduledFilter) {
  const date = new Date(post.publishAt);
  if (filter === "all") return true;
  if (filter === "today") return isToday(date);
  if (filter === "week") return isThisWeek(date, { weekStartsOn: 1 });
  return date.getTime() >= Date.now();
}

function groupByDay(posts: ScheduledPost[]) {
  return posts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const date = new Date(post.publishAt);
    const label = isSameDay(date, new Date())
      ? `Today - ${format(date, "EEEE, d MMM")}`
      : format(date, "EEEE, d MMM");
    acc[label] = [...(acc[label] ?? []), post];
    return acc;
  }, {});
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trim()}...`;
}

function defaultScheduleValue() {
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
  next.setMinutes(0, 0, 0);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${String(next.getHours()).padStart(2, "0")}:00`;
}
