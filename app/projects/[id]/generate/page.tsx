import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { GeneratePanel } from "@/components/projects/generate-panel";
import { getCurrentUser } from "@/lib/current-user";
import { demoProjects, getProject } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma/client";
import { serializeProject } from "@/lib/projects/serialize";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";

export default async function GeneratePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const project = await findProject(params.id, user?.id);
  if (!project) notFound();

  return (
    <AppShell projects={demoProjects} title="Generate" sourceBadge={project.title} user={user}>
      <GeneratePanel project={project} />
    </AppShell>
  );
}

async function findProject(id: string, userId?: string): Promise<Project | null> {
  const demoProject = getProject(id);
  if (demoProject) return demoProject;
  if (!userId) return null;

  try {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: { contents: true, hooks: true },
    });
    return project ? serializeProject(project) : null;
  } catch {
    return null;
  }
}
