import { AppShell } from "@/components/layout/AppShell";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";
import { getCurrentUser } from "@/lib/current-user";
import { demoProjects } from "@/lib/demo-data";
import { env, isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { serializeProject } from "@/lib/projects/serialize";
import type { Project } from "@/lib/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const projects = await loadProjects(user?.id);

  return (
    <AppShell projects={projects} title="Dashboard" user={user}>
      <ProjectDashboard initialProjects={projects} />
    </AppShell>
  );
}

async function loadProjects(userId?: string): Promise<Project[]> {
  if (isDemoMode()) return demoProjects;
  if (!userId) return env.requireAuth ? [] : demoProjects;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: { contents: { include: { scheduledPost: true } }, hooks: true },
      orderBy: { createdAt: "desc" },
    });

    return projects.map(serializeProject);
  } catch {
    return [];
  }
}
