import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { getCurrentUser } from "@/lib/current-user";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import {
  projectWorkspaceSelect,
  serializeProject,
} from "@/lib/projects/serialize";
import { getStoredProject } from "@/lib/projects/store";
import type { Project } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await findProjectMetadata(id);

  return {
    title: project ? `${project.title} - Recastr` : "Project - Recastr",
    openGraph: {
      title: project?.title ?? "Recastr project",
      description: "Generated social content pack from Recastr.",
      images: [project?.thumbnailUrl ?? "/og-image.png"],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const project = await findProject(id, user?.id);
  if (!project) notFound();

  return (
    <AppShell title="Projects" sourceBadge={project.title} user={user}>
      <ProjectWorkspace project={project} readOnly={user?.id === "demo-user"} />
    </AppShell>
  );
}

async function findProjectMetadata(id: string): Promise<Pick<Project, "title" | "thumbnailUrl"> | null> {
  if (isDemoMode()) {
    const localProject = getStoredProject(id);
    return localProject ? { title: localProject.title, thumbnailUrl: localProject.thumbnailUrl } : null;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { title: true, thumbnailUrl: true },
    });

    return project ? { title: project.title, thumbnailUrl: project.thumbnailUrl ?? undefined } : null;
  } catch {
    return null;
  }
}

async function findProject(id: string, userId?: string): Promise<Project | null> {
  if (isDemoMode()) return getStoredProject(id) ?? null;
  if (!userId) return null;

  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: projectWorkspaceSelect,
  });

  return project ? serializeProject(project) : null;
}
