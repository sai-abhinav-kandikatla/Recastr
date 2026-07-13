"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  MessageSquare,
  Briefcase,
  Heart,
  Video,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";

type AnalyticsData = {
  totalGeneratedPosts: number;
  totalProjects: number;
  totalScheduledPosts: number;
  completedReminders: number;
  platformCounts: Record<string, number>;
  chartData: Array<{
    date: string;
    created: number;
    scheduled: number;
  }>;
  todayActivity: number;
  weeklyActivity: number;
  monthlyActivity: number;
  topPlatform: string;
  generationSuccessRate: number;
  averageGenerationTimeSeconds: number;
};

export default function AnalyticsPage() {
  const { data, error, isError, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error ?? "Could not load analytics");
      }
      return payload as AnalyticsData;
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Analytics">
        <PageHeader title="Analytics" backHref="/dashboard" />
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--violet)]" />
            <p className="text-sm">Loading analytics...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Analytics">
        <PageHeader title="Analytics" backHref="/dashboard" />
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-8 text-center">
          <AlertCircle className="mb-4 h-10 w-10 text-red-400" />
          <h2 className="text-xl font-bold text-white">Analytics unavailable</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Could not load analytics right now."}
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!data) return null;

  const isOnboarding = data.totalGeneratedPosts === 0;
  const twitterCount = (data.platformCounts.TWITTER || 0) + (data.platformCounts.THREADS || 0);
  const linkedinCount = data.platformCounts.LINKEDIN || 0;
  const facebookIgCount =
    (data.platformCounts.FACEBOOK || 0) +
    (data.platformCounts.INSTAGRAM || 0) +
    (data.platformCounts.CAROUSEL || 0);
  const youtubeCount = data.platformCounts.COMMUNITY || 0;
  const totalProjects = data.totalProjects;
  const scheduledCount = data.totalScheduledPosts;
  const chartData = data.chartData;

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.created, d.scheduled, 1)), 1);

  const chartBars = chartData.map((bar) => {
    const h1 = (bar.created / maxVal) * 80;
    const h2 = (bar.scheduled / maxVal) * 80;
    return {
      h1: Math.max(h1, bar.created > 0 ? 5 : 0),
      h2: Math.max(h2, bar.scheduled > 0 ? 5 : 0),
      created: bar.created,
      scheduled: bar.scheduled,
      date: new Date(bar.date),
    };
  });

  return (
    <AppShell title="Analytics">
      <PageHeader title="Analytics" backHref="/dashboard" />
      <div className="space-y-8">
        {/* Onboarding Notice Banner */}
        {isOnboarding && (
          <div className="flex items-start gap-4 rounded-3xl border border-dashed border-[var(--violet)]/25 bg-[var(--violet-muted)] p-6">
            <AlertCircle className="h-6 w-6 text-[var(--violet)] mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white">Onboarding Mode</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                You haven't generated any social content packs yet. Your real generation and scheduling metrics will appear here after your first project.
              </p>
              <Button asChild size="sm" className="mt-4 rounded-full bg-[var(--violet)] px-5 text-black hover:bg-[var(--violet-hover)]">
                <Link href="/generate">
                  <Plus className="mr-2 h-4 w-4" /> Create content pack
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Summary</h1>
            <p className="mt-1 text-sm text-[#8A8A8A]">
              Track your content performance across all platforms.
            </p>
          </div>
          {!isOnboarding && (
            <Badge variant="success">
              Live updates active
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<MessageSquare className="h-4 w-4" />}
            label="Twitter & Threads"
            value={String(twitterCount)}
            hint="Total generated threads & posts"
          />
          <StatsCard
            icon={<Briefcase className="h-4 w-4" />}
            label="LinkedIn Posts"
            value={String(linkedinCount)}
            hint="Total generated professional insights"
          />
          <StatsCard
            icon={<Heart className="h-4 w-4" />}
            label="Facebook & Instagram"
            value={String(facebookIgCount)}
            hint="Total captions & carousel scripts"
          />
          <StatsCard
            icon={<Video className="h-4 w-4" />}
            label="YouTube Community"
            value={String(youtubeCount)}
            hint="Total community assets generated"
          />
        </div>

        {/* Performance metrics row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#232323] bg-[#0F0F0F] p-6 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Projects</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalProjects}</p>
          </div>
          <div className="rounded-2xl border border-[#232323] bg-[#0F0F0F] p-6 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Scheduled Reminders</p>
            <p className="mt-2 text-3xl font-bold text-white">{scheduledCount}</p>
          </div>
          <div className="rounded-2xl border border-[#232323] bg-[#0F0F0F] p-6 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Success Rate</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {`${data.generationSuccessRate}%`}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="rounded-2xl border border-[#232323] bg-[#0F0F0F] p-6">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-white">
                Repurposing Activity
              </h2>
              <p className="mt-0.5 text-xs text-[#8A8A8A]">
                Content pieces generated & scheduled over the last 14 days
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#8A8a8a]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-white" />
                Generated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--violet)]" />
                Scheduled
              </span>
            </div>
          </div>

          {/* Bar Chart Graphics */}
          <div className="flex h-48 items-end gap-3 px-2 border-b border-[#232323] pb-2">
            {chartBars.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Activity will appear after you generate or schedule content.
              </div>
            ) : chartBars.map((bar, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <div className="flex flex-1 items-end gap-1">
                  <div
                    className="w-full rounded-t bg-white"
                    style={{ height: `${bar.h1}%` }}
                    title={`${bar.created} posts generated`}
                  />
                  <div
                    className="w-full rounded-t bg-[var(--violet)]"
                    style={{ height: `${bar.h2}%` }}
                    title={`${bar.scheduled} posts scheduled`}
                  />
                </div>
                <div className="mt-2 text-center text-[9px] text-[#555] font-mono select-none h-4">
                  {i % 2 === 0 ? bar.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatsCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-[var(--violet)]">{icon}</div>
          <h3 className="text-sm font-medium text-white">{label}</h3>
        </div>
      </div>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      {hint && (
        <p className="mt-2 text-xs text-[#8A8A8A] leading-relaxed">{hint}</p>
      )}
    </div>
  );
}
