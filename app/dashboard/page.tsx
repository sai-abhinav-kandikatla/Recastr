import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma/client";
import { projectShellSelect, serializeProjectShell } from "@/lib/projects/serialize";
import type { Platform, PostStatus, Project, ScheduledPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your recent projects, content metrics, and scheduled reminders in your Recastr dashboard.",
  openGraph: {
    title: "Dashboard | Recastr",
    description: "View your recent projects, content metrics, and scheduled reminders.",
  },
  twitter: {
    title: "Dashboard | Recastr",
    description: "View your recent projects, content metrics, and scheduled reminders.",
  },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await loadDashboardData(user?.id);

  return (
    <AppShell projects={data.projects} title="Dashboard" user={user}>
      <ProjectDashboard
        initialProjects={data.projects}
        initialScheduled={data.scheduled}
        initialLoadError={data.error}
        demoLocked={user?.id === "demo-user"}
        user={user}
      />
    </AppShell>
  );
}

async function loadDashboardData(userId?: string): Promise<{
  projects: Project[];
  scheduled: ScheduledPost[];
  error?: string;
}> {
  if (!userId) return { projects: [], scheduled: [] };

  try {
    const [projects, scheduled] = await withTimeout(
      Promise.all([
        prisma.project.findMany({
          where: { userId },
          select: projectShellSelect,
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
        prisma.scheduledPost.findMany({
          where: { userId },
          select: {
            id: true,
            contentId: true,
            platform: true,
            postingMethod: true,
            scheduledAt: true,
            status: true,
            timezone: true,
            verificationRequired: true,
            verifiedByUser: true,
            publishedAt: true,
            failReason: true,
            content: { select: { body: true } },
          },
          orderBy: { scheduledAt: "desc" },
          take: 12,
        }),
      ]),
      8000,
    );

    return {
      projects: projects.map(serializeProjectShell),
      scheduled: scheduled.map((post) => ({
        id: post.id,
        outputId: post.contentId,
        contentId: post.contentId,
        platform: post.platform as Platform,
        postingMethod: post.postingMethod as "email_reminder" | "direct_post",
        publishAt: post.scheduledAt.toISOString(),
        scheduledAt: post.scheduledAt.toISOString(),
        status: post.status.toUpperCase() as PostStatus,
        title: post.content.body,
        timezone: post.timezone,
        verificationRequired: post.verificationRequired,
        verifiedByUser: post.verifiedByUser,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        failReason: post.failReason,
      })),
    };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return {
      projects: [],
      scheduled: [],
      error: "The database is temporarily unavailable. Retry to load your projects and activity.",
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Database request timed out")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
