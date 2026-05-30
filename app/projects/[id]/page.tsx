import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { getCurrentUser } from "@/lib/current-user";
import { demoProjects, getProject } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { serializeProject } from "@/lib/projects/serialize";
import { getStoredProject } from "@/lib/projects/store";
import type { Project } from "@/lib/types";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const project = getProject(params.id);
  return {
    title: project ? `${project.title} - Recastr` : "Project - Recastr",
    openGraph: {
      title: project?.title ?? "Recastr project",
      description: "Generated social content pack from Recastr.",
      images: [project?.thumbnailUrl ?? "/og-image.svg"],
    },
  };
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const project = await findProject(params.id, user?.id);
  if (!project) notFound();
  const shellProjects = isDemoMode() || project.id.startsWith("demo-") ? demoProjects : [project];

  return (
    <AppShell projects={shellProjects} title="Projects" sourceBadge={project.title} user={user}>
      <ProjectWorkspace project={project} />
    </AppShell>
  );
}

async function findProject(id: string, userId?: string): Promise<Project | null> {
  const demoProject = getProject(id);
  if (demoProject) return demoProject;

  if (isDemoMode()) {
    const storedProject = getStoredProject(id);
    if (storedProject) return storedProject;
  }
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
