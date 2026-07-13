import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/current-user";
import { WorkspaceEditor } from "@/components/workspace/WorkspaceEditor";
import { prisma } from "@/lib/prisma/client";
import { isDemoMode } from "@/lib/env";
import { getStoredProject } from "@/lib/projects/store";
import {
  projectWorkspaceSelect,
  serializeProject,
} from "@/lib/projects/serialize";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Recastr — Workspace",
  description: "Review and refine your repurposed social content assets.",
};

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ platform?: string }>;
}) {
  const { projectId } = await params;
  const { platform } = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/workspace/${projectId}`);
  }

  const project = await findProject(projectId, user.id);
  if (!project) {
    notFound();
  }

  return (
    <WorkspaceEditor
      project={project}
      defaultPlatform={platform || "linkedin"}
    />
  );
}

async function findProject(id: string, userId: string): Promise<Project | null> {
  if (isDemoMode()) {
    return getStoredProject(id) ?? null;
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      select: projectWorkspaceSelect,
    });

    return project ? serializeProject(project) : null;
  } catch (error) {
    console.error("WorkspacePage findProject failed:", error);
    return null;
  }
}
