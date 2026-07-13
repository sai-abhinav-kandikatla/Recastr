import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectIndexGrid } from "@/components/projects/ProjectIndexGrid";
import { DataLoadError } from "@/components/error/DataLoadError";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma/client";
import { projectShellSelect, serializeProjectShell } from "@/lib/projects/serialize";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse and manage all your content repurposing projects. Each project contains generated posts, reminders, and editing history.",
  openGraph: {
    title: "Projects | Recastr",
    description: "Browse all your content repurposing projects.",
  },
  twitter: {
    title: "Projects | Recastr",
    description: "Browse all your content repurposing projects.",
  },
};

export default async function ProjectsIndexPage() {
  const user = await getCurrentUser();
  const data = await loadProjects(user?.id);

  return (
    <AppShell projects={data.projects} title="Projects" user={user}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Projects</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Every source you analyze becomes a persistent project workspace.
            </p>
          </div>
          <Button asChild className="rounded-full bg-[var(--violet)] text-black hover:opacity-90 px-6 shrink-0">
            <Link href="/generate">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {data.error ? (
          <DataLoadError title="Projects unavailable" message={data.error} />
        ) : data.projects.length ? (
          <ProjectIndexGrid projects={data.projects} demoLocked={user?.id === "demo-user"} />
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-[var(--app-line-strong)] bg-[var(--app-surface)] p-16 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--app-panel)] text-primary">
              <FolderOpen className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold font-display">No projects yet</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
              Create a project, analyze a source, and generate your first content pack.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-[var(--violet)] px-8 text-black hover:bg-[var(--violet-hover)]">
              <Link href="/generate">
                <Plus className="mr-2 h-5 w-5" />
                Create Project
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

async function loadProjects(userId?: string): Promise<{ projects: Project[]; error?: string }> {
  if (!userId) return { projects: [] };

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      select: projectShellSelect,
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    return { projects: projects.map(serializeProjectShell) };
  } catch (error) {
    console.error("Failed to load projects index:", error);
    return {
      projects: [],
      error: "The database is temporarily unavailable. Retry to load your projects.",
    };
  }
}
