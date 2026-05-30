"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, FileText, Sparkles, Timer } from "lucide-react";
import { IngestFlow } from "@/components/ingest/IngestFlow";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";

export function ProjectDashboard({ initialProjects }: { initialProjects: Project[] }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const projectsThisMonth = initialProjects.filter((project) => {
    const createdAt = new Date(project.createdAt);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;
  const contentCount = initialProjects.reduce(
    (total, project) => total + (project.contents?.length ?? project.outputs.length),
    0,
  );
  const scheduledCount = initialProjects.reduce(
    (total, project) => {
      if (project.contents?.length) {
        return total + project.contents.filter((content) => Boolean(content.scheduledPost)).length;
      }
      return total + project.outputs.filter((output) => output.approved && project.status === "SCHEDULED").length;
    },
    0,
  );
  const approvedCount = initialProjects.reduce(
    (total, project) => {
      if (project.contents?.length) return total + project.contents.filter((content) => content.approved).length;
      return total + project.outputs.filter((output) => output.approved).length;
    },
    0,
  );
  const timeSavedHours = Math.max(0, (contentCount * 8 + initialProjects.length * 20) / 60);
  const metrics: Array<{
    label: string;
    value: string;
    icon: ComponentType<{ className?: string }>;
    trend: string;
  }> = [
    { label: "Projects this month", value: String(projectsThisMonth), icon: FileText, trend: "private" },
    { label: "Content generated", value: String(contentCount), icon: Sparkles, trend: `${approvedCount} approved` },
    { label: "Scheduled posts", value: String(scheduledCount), icon: Clock3, trend: "live" },
    { label: "Time saved", value: formatHours(timeSavedHours), icon: Timer, trend: "estimated" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="mt-1 text-3xl font-medium tracking-normal">
          You have {contentCount} pieces ready to refine.
        </h1>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        {metrics.map(({ icon: Icon, label, trend, value }, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-4"
            initial={{ opacity: 0, y: 10 }}
            key={label}
            transition={{ delay: index * 0.06, duration: 0.24, ease: [0.16, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-[var(--violet)]" />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-[28px] font-medium">{value}</p>
              <Badge variant="muted">{trend}</Badge>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Quick ingest</h2>
            <p className="text-sm text-muted-foreground">
              Analyze a source, select hooks, then stream generated content without leaving the page.
            </p>
          </div>
        </div>
        <IngestFlow demoProjects={initialProjects} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Recent projects</h2>
            <p className="text-sm text-muted-foreground">Continue editing, exporting, or scheduling generated assets.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {initialProjects.map((project) => (
            <Link
              className="group rounded-2xl border bg-card p-4 transition-transform duration-200 hover:scale-[1.02]"
              href={`/projects/${project.id}`}
              key={project.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--violet-light)] text-[var(--violet)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <Badge variant="muted">{project.sourceType.toLowerCase()}</Badge>
              </div>
              <h3 className="mt-4 line-clamp-2 text-base font-medium">{project.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generated {project.contents?.length ?? project.outputs.length} pieces
              </p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Twitter · LinkedIn · Instagram · YouTube</p>
                <span className="inline-flex h-8 items-center justify-center gap-2 rounded-[8px] border border-border bg-card px-3 text-xs font-medium text-card-foreground">
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatHours(hours: number) {
  if (hours <= 0) return "0 hrs";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;
}
