import { AppShell } from "@/components/layout/AppShell";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma/client";
import { projectShellSelect, serializeProjectShell } from "@/lib/projects/serialize";
import type { DbProjectShell } from "@/lib/projects/serialize";
import type { Platform, PostStatus, Project } from "@/lib/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const projects = await loadProjects(user?.id);

  return (
    <AppShell projects={projects} title="Dashboard" user={user}>
      <ProjectDashboard
        initialProjects={projects}
        demoLocked={user?.id === "demo-user"}
        user={user}
      />
    </AppShell>
  );
}

async function loadProjects(userId?: string): Promise<Project[]> {
  if (!userId) return [];

  const timeout = new Promise<DashboardProjectRow[]>((_, reject) =>
    setTimeout(() => reject(new Error("DB Timeout")), 8000),
  );
  try {
    const projects = await Promise.race<DashboardProjectRow[]>([
      prisma.project.findMany({
        where: { userId },
        select: {
          ...projectShellSelect,
          contents: {
            select: {
              id: true,
              scheduledPost: {
                select: {
                  id: true,
                  contentId: true,
                  platform: true,
                  scheduledAt: true,
                  status: true,
                  publishedAt: true,
                  failReason: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      timeout,
    ]);

    return projects.map(serializeDashboardProject);
  } catch (error) {
    console.error("Failed to load projects:", error);
    return [];
  }
}

type DashboardProjectRow = DbProjectShell & {
  contents: Array<{
    id: string;
    scheduledPost: {
      id: string;
      contentId: string;
      platform: string;
      scheduledAt: Date;
      status: string;
      publishedAt: Date | null;
      failReason: string | null;
    } | null;
  }>;
};

function serializeDashboardProject(project: DashboardProjectRow): Project {
  const shell = serializeProjectShell(project);
  return {
    ...shell,
    contents: project.contents.map((content, index) => ({
      id: content.id,
      projectId: project.id,
      platform: "TWITTER" as Platform,
      contentType: "Post",
      body: "",
      originalBody: "",
      tone: "casual",
      approved: false,
      order: index,
      scheduledPost: content.scheduledPost
        ? {
            id: content.scheduledPost.id,
            outputId: content.scheduledPost.contentId,
            contentId: content.scheduledPost.contentId,
            platform: content.scheduledPost.platform as Platform,
            publishAt: content.scheduledPost.scheduledAt.toISOString(),
            scheduledAt: content.scheduledPost.scheduledAt.toISOString(),
            status: content.scheduledPost.status.toUpperCase() as PostStatus,
            title: "Scheduled post",
            publishedAt: content.scheduledPost.publishedAt?.toISOString() ?? null,
            failReason: content.scheduledPost.failReason,
          }
        : null,
      createdAt: project.createdAt.toISOString(),
    })),
    outputs: [],
  };
}
