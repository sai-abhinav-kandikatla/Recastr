"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileJson,
  FileText,
  Mail,
  Plus,
  Sparkles,
  Table,
} from "lucide-react";
import { toast } from "sonner";
import { ContentCard, type ContentCardPlatform } from "@/components/content/ContentCard";
import { HookSidebar } from "@/components/content/HookSidebar";
import { PlatformPreviewEngine } from "@/components/preview/PlatformPreview";
import { Button } from "@/components/ui/button";
import { assertApiOk, readApiJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { PreviewPlatform } from "@/lib/preview-content";
import type { ContentPiece, Platform, Project, ViralHook } from "@/lib/types";

type PlatformFilter = "all" | ContentCardPlatform;
type ExportFormat = "pdf" | "csv" | "json" | "notion";
type FeedItem =
  | { kind: "label"; id: string; platform: ContentCardPlatform }
  | { kind: "content"; id: string; content: ContentPiece };

const platformFilters: Array<{ value: PlatformFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "twitter", label: "Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
];

const platformOrder: ContentCardPlatform[] = ["twitter", "linkedin", "instagram", "youtube"];

const platformLabels: Record<ContentCardPlatform, string> = {
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube",
};

const platformText: Record<ContentCardPlatform, string> = {
  twitter: "Threads, tweets, punchy ideas",
  linkedin: "Narrative posts and lessons",
  instagram: "Captions and reel scripts",
  youtube: "Shorts scripts and descriptions",
};

const drawerSlide = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { duration: 0.26, ease: [0.16, 1, 0.32, 1] },
} as const;

export function ProjectWorkspace({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const initialContent = useMemo(() => normalizeContents(project), [project]);
  const hooks = useMemo(() => normalizeHooks(project), [project]);
  const [contents, setContents] = useState(initialContent);
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scheduledDates, setScheduledDates] = useState<Record<string, Date>>({});
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    () => initialContent[0]?.id ?? null,
  );
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>(() =>
    initialContent.filter((item) => item.approved).map((item) => item.id),
  );

  const updateContentMutation = useMutation({
    mutationFn: patchContent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "credit_exhausted") return;
      toast.error("Could not save content change");
    },
  });

  const toneMutation = useMutation({
    mutationFn: rewriteTone,
    onSuccess: ({ id, rewritten, tone }) => {
      setContents((current) =>
        current.map((item) =>
          item.id === id ? { ...item, body: rewritten, tone } : item,
        ),
      );
      updateContentMutation.mutate({ id, body: rewritten, tone });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "credit_exhausted") return;
      toast.error("Tone rewrite failed");
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: scheduleContent,
    onSuccess: () => toast.success("Scheduled"),
    onError: (error) => {
      if (error instanceof Error && error.message === "credit_exhausted") return;
      toast.error("Schedule failed");
    },
  });

  const filteredContents = useMemo(() => {
    return contents
      .filter((item) => selectedHookId === null || item.hookId === selectedHookId)
      .filter((item) => platformFilter === "all" || toCardPlatform(item.platform) === platformFilter)
      .sort((a, b) => {
        const platformDelta =
          platformOrder.indexOf(toCardPlatform(a.platform)) -
          platformOrder.indexOf(toCardPlatform(b.platform));
        return platformDelta || a.order - b.order;
      });
  }, [contents, platformFilter, selectedHookId]);

  const feedItems = useMemo(() => buildFeedItems(filteredContents), [filteredContents]);
  const selectedPreviewContent = useMemo(() => {
    return (
      contents.find((item) => item.id === selectedPreviewId) ??
      filteredContents[0] ??
      contents[0]
    );
  }, [contents, filteredContents, selectedPreviewId]);

  useEffect(() => {
    if (filteredContents.length === 0) return;
    if (selectedPreviewId && filteredContents.some((item) => item.id === selectedPreviewId)) return;
    setSelectedPreviewId(filteredContents[0]?.id ?? null);
  }, [filteredContents, selectedPreviewId]);

  const handleApprove = useCallback(
    (id: string) => {
      setContents((current) =>
        current.map((item) =>
          item.id === id ? { ...item, approved: true } : item,
        ),
      );
      setSelectedExportIds((current) =>
        current.includes(id) ? current : [...current, id],
      );
      updateContentMutation.mutate({ id, approved: true });
    },
    [updateContentMutation],
  );

  const handleBodyChange = useCallback(
    (id: string, body: string) => {
      setContents((current) =>
        current.map((item) => (item.id === id ? { ...item, body } : item)),
      );
      updateContentMutation.mutate({ id, body });
    },
    [updateContentMutation],
  );

  const handleToneChange = useCallback(
    (id: string, tone: string) => {
      const content = contents.find((item) => item.id === id);
      if (!content) return;
      setContents((current) =>
        current.map((item) => (item.id === id ? { ...item, tone } : item)),
      );
      toneMutation.mutate({ id, content: content.body, tone });
    },
    [contents, toneMutation],
  );

  const handleSchedule = useCallback(
    (id: string, date: Date) => {
      const content = contents.find((item) => item.id === id);
      if (!content) return;
      setScheduledDates((current) => ({ ...current, [id]: date }));
      scheduleMutation.mutate({
        contentId: id,
        platform: content.platform,
        scheduledAt: date.toISOString(),
      });
    },
    [contents, scheduleMutation],
  );

  const handleCopy = useCallback(
    (id: string) => {
      const content = contents.find((item) => item.id === id);
      if (!content) return;
      void navigator.clipboard.writeText(content.body);
      toast.success("Copied");
    },
    [contents],
  );

  const handleRegenerate = useCallback(
    (id: string) => {
      const content = contents.find((item) => item.id === id);
      if (!content) return;
      const next = regenerateBody(project, content, selectedHookId, hooks);
      streamReplaceContent(id, next, setContents);
      updateContentMutation.mutate({ id, body: next });
    },
    [contents, hooks, project, selectedHookId, updateContentMutation],
  );

  const addGeneratedCards = useCallback(
    (cards: ContentPiece[]) => {
      setContents((current) => [...cards, ...current]);
      setPlatformFilter("all");
      setSelectedHookId(null);
      toast.success(`${cards.length} new pieces generated`);
    },
    [],
  );

  const exportIds = selectedExportIds.length ? selectedExportIds : filteredContents.map((item) => item.id);

  return (
    <div className="text-foreground">
      <motion.div
        animate={{ x: drawerOpen ? -24 : 0 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.32, 1] }}
        className={cn("mx-auto max-w-[1480px] pb-10", drawerOpen && "lg:pr-[420px]")}
      >
        <ProjectStudioTopBar
          project={project}
          platformFilter={platformFilter}
          onPlatformFilterChange={setPlatformFilter}
          exportOpen={exportOpen}
          onExportToggle={() => setExportOpen((current) => !current)}
          onGenerateToggle={() => setDrawerOpen(true)}
        />

        <AnimatePresence initial={false}>
          {exportOpen ? (
            <ExportInlinePanel
              contents={filteredContents}
              selectedIds={exportIds}
              format={exportFormat}
              onFormatChange={setExportFormat}
              onToggleContent={(id) =>
                setSelectedExportIds((current) =>
                  current.includes(id)
                    ? current.filter((item) => item !== id)
                    : [...current, id],
                )
              }
              projectId={project.id}
            />
          ) : null}
        </AnimatePresence>

        <div className="grid gap-4 border-t pt-5 min-[700px]:grid-cols-[325px_minmax(0,1fr)] min-[1180px]:grid-cols-[325px_minmax(0,1fr)_390px]">
          <HookSidebar
            hooks={hooks}
            selectedHookId={selectedHookId}
            contentCount={contents.length}
            onSelect={setSelectedHookId}
          />

          <section className="min-w-0">
            {feedItems.length > 0 ? (
              <ContentFeed
                feedItems={feedItems}
                scheduledDates={scheduledDates}
                selectedContentId={selectedPreviewContent?.id ?? null}
                onApprove={handleApprove}
                onToneChange={handleToneChange}
                onBodyChange={handleBodyChange}
                onSchedule={handleSchedule}
                onCopy={handleCopy}
                onRegenerate={handleRegenerate}
                onActivate={setSelectedPreviewId}
              />
            ) : (
              <div className="rounded-[16px] border border-dashed bg-card/60 p-10 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-medium">No cards for this filter yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Clear the hook filter or generate more content from the right drawer.
                </p>
                <Button className="mt-5" onClick={() => setDrawerOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Generate more
                </Button>
              </div>
            )}
          </section>

          <PreviewInspector
            content={selectedPreviewContent}
            previewTheme={previewTheme}
            onPreviewThemeChange={setPreviewTheme}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {drawerOpen ? (
          <GenerateDrawer
            project={project}
            selectedHook={hooks.find((hook) => hook.id === selectedHookId)}
            onClose={() => setDrawerOpen(false)}
            onGenerated={addGeneratedCards}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProjectStudioTopBar({
  project,
  platformFilter,
  onPlatformFilterChange,
  exportOpen,
  onExportToggle,
  onGenerateToggle,
}: {
  project: Project;
  platformFilter: PlatformFilter;
  onPlatformFilterChange: (platform: PlatformFilter) => void;
  exportOpen: boolean;
  onExportToggle: () => void;
  onGenerateToggle: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 bg-[var(--page-bg)]/95 py-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Button asChild size="sm" variant="ghost" aria-label="Back to dashboard" className="h-8 px-0 text-[15px] hover:bg-transparent">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div className="min-w-0 max-w-[190px]">
            <p className="truncate text-[18px] font-medium leading-[1.05] text-foreground">
              {project.title}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 min-[900px]:ml-auto">
          {platformFilters.map((item) => {
            const active = platformFilter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onPlatformFilterChange(item.value)}
                className={filterPillClass(item.value, active)}
              >
                {active ? (
                  <motion.span
                    layoutId="project-platform-filter"
                    className="absolute inset-0 rounded-full bg-[var(--violet)]"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.32, 1] }}
                  />
                ) : null}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button className="h-10 rounded-[11px] px-4 text-[15px] font-medium" variant="secondary" onClick={onExportToggle}>
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className={cn("h-3.5 w-3.5 transition", exportOpen && "rotate-180")} />
          </Button>
          <Button onClick={onGenerateToggle} className="h-10 rounded-[11px] bg-[var(--violet)] px-5 text-[15px] font-medium text-white hover:bg-[var(--violet-dark)]">
            + Generate more
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContentFeed({
  feedItems,
  scheduledDates,
  selectedContentId,
  onApprove,
  onToneChange,
  onBodyChange,
  onSchedule,
  onCopy,
  onRegenerate,
  onActivate,
}: {
  feedItems: FeedItem[];
  scheduledDates: Record<string, Date>;
  selectedContentId: string | null;
  onApprove: (id: string) => void;
  onToneChange: (id: string, tone: string) => void;
  onBodyChange: (id: string, body: string) => void;
  onSchedule: (id: string, date: Date) => void;
  onCopy: (id: string) => void;
  onRegenerate: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const contentCount = feedItems.filter((item) => item.kind === "content").length;
  const virtualizer = useVirtualizer({
    count: feedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (feedItems[index]?.kind === "label" ? 42 : 245),
    overscan: 5,
  });

  if (contentCount <= 20) {
    return (
      <div className="space-y-3">
        {feedItems.map((item) =>
          item.kind === "label" ? (
            <PlatformLabel key={item.id} platform={item.platform} />
          ) : (
            <ContentCardAdapter
              key={item.id}
              content={item.content}
              scheduledAt={scheduledDates[item.id]}
              selected={item.id === selectedContentId}
              onApprove={onApprove}
              onToneChange={onToneChange}
              onBodyChange={onBodyChange}
              onSchedule={onSchedule}
              onCopy={onCopy}
              onRegenerate={onRegenerate}
              onActivate={onActivate}
            />
          ),
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-13rem)] overflow-y-auto pr-2"
    >
      <div
        className="relative"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = feedItems[virtualItem.index];
          if (!item) return null;
          return (
            <div
              key={item.id}
              className="absolute left-0 top-0 w-full pb-3"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {item.kind === "label" ? (
                <PlatformLabel platform={item.platform} />
              ) : (
                <ContentCardAdapter
                  content={item.content}
                  scheduledAt={scheduledDates[item.id]}
                  selected={item.id === selectedContentId}
                  onApprove={onApprove}
                  onToneChange={onToneChange}
                  onBodyChange={onBodyChange}
                  onSchedule={onSchedule}
                  onCopy={onCopy}
                  onRegenerate={onRegenerate}
                  onActivate={onActivate}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContentCardAdapter({
  content,
  scheduledAt,
  selected,
  onApprove,
  onToneChange,
  onBodyChange,
  onSchedule,
  onCopy,
  onRegenerate,
  onActivate,
}: {
  content: ContentPiece;
  scheduledAt?: Date;
  selected: boolean;
  onApprove: (id: string) => void;
  onToneChange: (id: string, tone: string) => void;
  onBodyChange: (id: string, body: string) => void;
  onSchedule: (id: string, date: Date) => void;
  onCopy: (id: string) => void;
  onRegenerate: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  return (
    <ContentCard
      id={content.id}
      platform={toCardPlatform(content.platform)}
      contentType={formatContentType(content.contentType)}
      body={content.body}
      tone={content.tone}
      approved={content.approved}
      scheduledAt={scheduledAt}
      order={content.order}
      selected={selected}
      onApprove={onApprove}
      onToneChange={onToneChange}
      onBodyChange={onBodyChange}
      onSchedule={onSchedule}
      onCopy={onCopy}
      onRegenerate={onRegenerate}
      onActivate={onActivate}
    />
  );
}

function PreviewInspector({
  content,
  previewTheme,
  onPreviewThemeChange,
}: {
  content?: ContentPiece;
  previewTheme: "light" | "dark";
  onPreviewThemeChange: (theme: "light" | "dark") => void;
}) {
  if (!content) {
    return (
      <aside className="min-[700px]:col-span-2 min-[1180px]:col-span-1">
        <div className="sticky top-20 rounded-[18px] border border-dashed bg-card/70 p-6 text-center">
          <Eye className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No preview selected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Focus a content card to render its platform preview.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="min-w-0 min-[700px]:col-span-2 min-[1180px]:col-span-1">
      <div className="sticky top-20 rounded-[20px] border border-white/10 bg-slate-950 p-4 text-white">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Platform preview engine</p>
            <p className="mt-1 text-xs text-slate-400">
              Rendering the selected {formatContentType(content.contentType).toLowerCase()} live.
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
            {platformLabels[toCardPlatform(content.platform)]}
          </span>
        </div>
        <PlatformPreviewEngine
          platform={toPreviewPlatform(content.platform)}
          draft={content.body}
          theme={previewTheme}
          onThemeChange={onPreviewThemeChange}
        />
      </div>
    </aside>
  );
}

function PlatformLabel({ platform }: { platform: ContentCardPlatform }) {
  return (
    <div className="sticky top-0 z-[5] -mx-1 bg-[var(--page-bg)]/90 px-1 py-2 backdrop-blur">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", platformDot(platform))} />
        <span className="font-medium text-foreground">{platformLabels[platform]}</span>
        <span>{platformText[platform]}</span>
      </div>
    </div>
  );
}

function ExportInlinePanel({
  contents,
  selectedIds,
  format,
  onFormatChange,
  onToggleContent,
  projectId,
}: {
  contents: ContentPiece[];
  selectedIds: string[];
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  onToggleContent: (id: string) => void;
  projectId: string;
}) {
  const [email, setEmail] = useState("");

  async function download() {
    if (format === "notion") {
      toast.info(email ? "Notion invite saved" : "Notion export is coming soon");
      return;
    }

    const response = await fetch(`/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, contentIds: selectedIds }),
    });
    try {
      await assertApiOk(response);
    } catch (error) {
      if (error instanceof Error && error.message === "credit_exhausted") return;
      toast.error("Export failed");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recastr-${projectId}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} downloaded`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mt-3 overflow-hidden rounded-[16px] border bg-card/90 shadow-sm"
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[220px_1fr_220px]">
        <div className="space-y-2">
          {exportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFormatChange(option.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground",
                format === option.value && "border-primary bg-primary/10 text-primary",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {contents.map((content) => (
            <label
              key={content.id}
              className="flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 text-sm"
            >
              <input
                checked={selectedIds.includes(content.id)}
                className="mt-1 accent-violet-600"
                onChange={() => onToggleContent(content.id)}
                type="checkbox"
              />
              <span>
                <span className="block font-medium">
                  {platformLabels[toCardPlatform(content.platform)]} · {formatContentType(content.contentType)}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                  {content.body}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="rounded-[12px] border bg-muted/30 p-4">
          <p className="text-sm font-medium">Export preview</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {format === "notion"
              ? "Notion export is coming soon. Leave an email and we will wire it to your workspace."
              : `${selectedIds.length} pieces will be exported as ${format.toUpperCase()} with platform labels and source metadata.`}
          </p>
          {format === "notion" ? (
            <div className="mt-4 space-y-2">
              <input
                className="h-9 w-full rounded-[8px] border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          ) : null}
          <Button className="mt-4 w-full" onClick={download}>
            <Download className="h-4 w-4" />
            {format === "notion" ? "Join waitlist" : "Download"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

const exportOptions: Array<{ value: ExportFormat; label: string; icon: ReactNode }> = [
  { value: "pdf", label: "PDF", icon: <FileText className="h-4 w-4" /> },
  { value: "csv", label: "CSV", icon: <Table className="h-4 w-4" /> },
  { value: "json", label: "JSON", icon: <FileJson className="h-4 w-4" /> },
  { value: "notion", label: "Notion", icon: <Mail className="h-4 w-4" /> },
];

function GenerateDrawer({
  project,
  selectedHook,
  onClose,
  onGenerated,
}: {
  project: Project;
  selectedHook?: ViralHook;
  onClose: () => void;
  onGenerated: (contents: ContentPiece[]) => void;
}) {
  const [platforms, setPlatforms] = useState<ContentCardPlatform[]>(["twitter", "linkedin"]);
  const [contentTypes, setContentTypes] = useState(["Tweet", "LinkedIn post"]);
  const [tone, setTone] = useState("casual");
  const [wordCount, setWordCount] = useState(160);
  const [stream, setStream] = useState("");
  const [generating, setGenerating] = useState(false);

  const togglePlatform = useCallback((platform: ContentCardPlatform) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }, []);

  const toggleContentType = useCallback((type: string) => {
    setContentTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  }, []);

  async function generate() {
    if (platforms.length === 0 || contentTypes.length === 0) return;
    setGenerating(true);
    setStream("");
    const text = `Generating ${contentTypes.join(", ")} for ${platforms.map((item) => platformLabels[item]).join(", ")} from ${selectedHook?.text ?? project.title}.`;
    for (const token of text.split(/(\s+)/).filter(Boolean)) {
      setStream((current) => `${current}${token}`);
      await new Promise((resolve) => window.setTimeout(resolve, 28));
    }
    const cards = createGeneratedCards(project, selectedHook, platforms, contentTypes, tone, wordCount);
    onGenerated(cards);
    setGenerating(false);
  }

  return (
    <motion.aside
      {...drawerSlide}
      className="fixed bottom-0 right-0 top-16 z-30 w-full border-l bg-card/95 shadow-2xl backdrop-blur-xl sm:w-[420px]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-medium">Generate more</p>
            <p className="text-xs text-muted-foreground">
              {selectedHook ? "Using selected hook" : "Using full source"}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <ControlGroup title="Platforms">
            {platformOrder.map((platform) => (
              <TogglePill
                key={platform}
                active={platforms.includes(platform)}
                label={platformLabels[platform]}
                onClick={() => togglePlatform(platform)}
              />
            ))}
          </ControlGroup>

          <ControlGroup title="Content types">
            {["Tweet", "Thread", "LinkedIn post", "Reel script", "Caption", "Shorts script"].map((type) => (
              <TogglePill
                key={type}
                active={contentTypes.includes(type)}
                label={type}
                onClick={() => toggleContentType(type)}
              />
            ))}
          </ControlGroup>

          <div>
            <p className="mb-3 text-sm font-medium">Tone</p>
            <div className="grid gap-2">
              {[
                ["professional", "Crisp, credible, decision-ready."],
                ["casual", "Human, direct, low-friction."],
                ["educational", "Structured, useful, tactical."],
                ["entertaining", "Punchy, visual, high-energy."],
              ].map(([value, sample]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTone(value)}
                  className={cn(
                    "rounded-[12px] border p-3 text-left transition hover:bg-muted",
                    tone === value && "border-primary bg-primary/10",
                  )}
                >
                  <p className="text-sm font-medium capitalize">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sample}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Word count</span>
              <span className="text-muted-foreground">{wordCount}</span>
            </div>
            <input
              className="w-full accent-violet-600"
              min={60}
              max={500}
              value={wordCount}
              onChange={(event) => setWordCount(Number(event.target.value))}
              type="range"
            />
          </div>

          <Button className="w-full" disabled={generating} onClick={generate}>
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating" : "Generate"}
          </Button>

          <div className="min-h-32 rounded-[12px] border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {stream || "Live generated output will stream here."}
            {generating ? <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" /> : null}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function TogglePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground",
        active && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
      )}
    >
      {active ? <Check className="mr-1 inline h-3 w-3" /> : null}
      {label}
    </button>
  );
}

async function patchContent(payload: {
  id: string;
  body?: string;
  approved?: boolean;
  tone?: string;
}) {
  const response = await fetch(`/api/content/${payload.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertApiOk(response);
  return response.json() as Promise<{ content: unknown }>;
}

async function rewriteTone({
  id,
  content,
  tone,
}: {
  id: string;
  content: string;
  tone: string;
}) {
  const response = await fetch("/api/tone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId: id, content, tone }),
  });
  const data = await readApiJson<{ rewritten?: string; content?: string }>(response);
  return { id, tone, rewritten: data.rewritten ?? data.content ?? content };
}

async function scheduleContent(payload: {
  contentId: string;
  platform: Platform;
  scheduledAt: string;
}) {
  const response = await fetch("/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertApiOk(response);
  return response.json() as Promise<{ scheduledPostId: string }>;
}

function normalizeContents(project: Project): ContentPiece[] {
  const source = project.contents?.length
    ? project.contents
    : project.outputs.map((output, index) => {
        const body = typeof output.content === "string" ? output.content : JSON.stringify(output.content, null, 2);
        return {
          id: output.id,
          projectId: output.projectId,
          platform: output.platform,
          contentType: output.outputType,
          body,
          originalBody: typeof output.originalContent === "string" ? output.originalContent : body,
          tone: String(output.tone).toLowerCase(),
          approved: output.approved,
          order: index,
          createdAt: output.createdAt,
        };
      });

  return source.map((item, index) => ({
    ...item,
    platform: normalizeSupportedPlatform(item.platform),
    tone: item.tone.toLowerCase(),
    order: item.order ?? index,
  }));
}

function normalizeHooks(project: Project): ViralHook[] {
  return project.hooks?.length
    ? project.hooks
    : project.summary.hooks.slice(0, 5).map((text, index) => ({
        id: `${project.id}-hook-${index + 1}`,
        projectId: project.id,
        text,
        hookType: index % 2 === 0 ? "Curiosity gap" : "Data",
        reachScore: 88 - index * 4,
      }));
}

function buildFeedItems(contents: ContentPiece[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const platform of platformOrder) {
    const group = contents.filter((item) => toCardPlatform(item.platform) === platform);
    if (group.length === 0) continue;
    items.push(...group.map((content) => ({ kind: "content" as const, id: content.id, content })));
  }
  return items;
}

function filterPillClass(filter: PlatformFilter, active: boolean) {
  const base = "relative h-8 rounded-full border px-4 text-[15px] font-medium transition";
  if (active) return cn(base, "border-[var(--violet)] bg-[var(--violet)] text-white");
  if (filter === "twitter") return cn(base, "border-[var(--twitter)] text-[var(--twitter)] hover:bg-sky-500/10");
  if (filter === "linkedin") return cn(base, "border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10");
  if (filter === "instagram") return cn(base, "border-[var(--instagram)] text-[var(--instagram)] hover:bg-pink-500/10");
  if (filter === "youtube") return cn(base, "border-[var(--youtube)] text-[var(--youtube)] hover:bg-red-500/10");
  return cn(base, "border-[var(--violet)] text-[var(--violet)]");
}

function toCardPlatform(platform: Platform): ContentCardPlatform {
  if (platform === "TWITTER") return "twitter";
  if (platform === "LINKEDIN") return "linkedin";
  if (platform === "INSTAGRAM" || platform === "CAROUSEL" || platform === "STORY") return "instagram";
  return "youtube";
}

function toPreviewPlatform(platform: Platform): PreviewPlatform {
  if (platform === "TWITTER") return "TWITTER";
  if (platform === "LINKEDIN") return "LINKEDIN";
  if (platform === "INSTAGRAM" || platform === "CAROUSEL" || platform === "STORY") return "INSTAGRAM";
  if (platform === "FACEBOOK") return "FACEBOOK";
  if (platform === "THREADS") return "THREADS";
  return "COMMUNITY";
}

function fromCardPlatform(platform: ContentCardPlatform): Platform {
  if (platform === "twitter") return "TWITTER";
  if (platform === "linkedin") return "LINKEDIN";
  if (platform === "instagram") return "INSTAGRAM";
  return "YOUTUBE";
}

function normalizeSupportedPlatform(platform: Platform): Platform {
  if (platform === "TWITTER" || platform === "LINKEDIN" || platform === "INSTAGRAM" || platform === "YOUTUBE") {
    return platform;
  }
  if (platform === "CAROUSEL" || platform === "STORY") return "INSTAGRAM";
  return "YOUTUBE";
}

function platformDot(platform: ContentCardPlatform) {
  if (platform === "twitter") return "bg-sky-500";
  if (platform === "linkedin") return "bg-[#0A66C2]";
  if (platform === "instagram") return "bg-[#E1306C]";
  return "bg-[#FF0000]";
}

function formatContentType(contentType: string) {
  const lower = contentType.toLowerCase();
  if (lower.includes("thread")) return "Thread";
  if (lower.includes("tweet")) return "Tweet";
  if (lower.includes("caption")) return "Caption";
  if (lower.includes("script") || lower.includes("reel")) return "Script";
  if (lower.includes("post")) return "Post";
  return contentType;
}

function regenerateBody(
  project: Project,
  content: ContentPiece,
  selectedHookId: string | null,
  hooks: ViralHook[],
) {
  const hook = hooks.find((item) => item.id === (selectedHookId ?? content.hookId));
  const seed = hook?.text ?? project.summary.hooks[0] ?? project.title;
  const platform = platformLabels[toCardPlatform(content.platform)];
  return `${seed}\n\nHere is the sharper ${platform} version:\n\n${content.body.replace(/\s+/g, " ").slice(0, 260)}\n\nMake the opening more specific, keep the source promise, and close with one clear action.`;
}

function streamReplaceContent(
  id: string,
  body: string,
  setContents: React.Dispatch<React.SetStateAction<ContentPiece[]>>,
) {
  const tokens = body.split(/(\s+)/).filter(Boolean);
  let index = 0;
  setContents((current) =>
    current.map((item) => (item.id === id ? { ...item, body: "" } : item)),
  );
  const timer = window.setInterval(() => {
    index += 1;
    const next = tokens.slice(0, index).join("");
    setContents((current) =>
      current.map((item) => (item.id === id ? { ...item, body: next } : item)),
    );
    if (index >= tokens.length) window.clearInterval(timer);
  }, 22);
}

function createGeneratedCards(
  project: Project,
  selectedHook: ViralHook | undefined,
  platforms: ContentCardPlatform[],
  contentTypes: string[],
  tone: string,
  wordCount: number,
): ContentPiece[] {
  const stamp = Date.now().toString(36);
  const hookText = selectedHook?.text ?? project.summary.hooks[0] ?? project.title;
  const maxWords = Math.max(30, wordCount);
  const cards: ContentPiece[] = [];

  platforms.forEach((platform, platformIndex) => {
    contentTypes.forEach((contentType, typeIndex) => {
      const platformName = platformLabels[platform];
      const body = buildGeneratedBody(project.title, hookText, platformName, contentType, maxWords);
      cards.push({
        id: `${project.id}-${platform}-${stamp}-${platformIndex}-${typeIndex}`,
        projectId: project.id,
        hookId: selectedHook?.id,
        platform: fromCardPlatform(platform),
        contentType,
        body,
        originalBody: body,
        tone,
        approved: false,
        order: platformIndex * 10 + typeIndex,
        createdAt: new Date().toISOString(),
      });
    });
  });

  return cards;
}

function buildGeneratedBody(
  title: string,
  hook: string,
  platform: string,
  contentType: string,
  wordCount: number,
) {
  const base = `${hook}\n\nUse "${title}" as the proof source. This ${contentType.toLowerCase()} should feel native to ${platform}: specific opening, one useful insight, and a clear next action.`;
  if (platform === "Twitter/X") {
    return `${hook}\n\nOne long-form source becomes useful when the best idea gets translated, not copied. Pull the tension, make one promise, then ship it in the format the platform expects.`;
  }
  if (platform === "YouTube Shorts") {
    return `Hook: ${hook}\n\nScene 1: Show the source title.\nScene 2: Name the mistake most viewers make.\nScene 3: Give the quick fix in three beats.\nCTA: Subscribe for the full breakdown.`;
  }
  return base.split(/\s+/).slice(0, wordCount).join(" ");
}
