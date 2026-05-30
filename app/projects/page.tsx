import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, FolderOpen, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/current-user";
import { demoProjects } from "@/lib/demo-data";
import { env, isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { serializeProject } from "@/lib/projects/serialize";
import type { Project } from "@/lib/types";

export default async function ProjectsIndexPage() {
  const user = await getCurrentUser();
  const projects = await loadProjects(user?.id);

  return (
    <AppShell projects={projects} title="Projects" user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every source you analyze becomes a project with hooks, generated assets, and export history.
          </p>
        </div>

        {projects.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-2xl border bg-card p-4 transition hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--violet-light)] text-[var(--violet)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <Badge variant="muted">{project.sourceType.toLowerCase()}</Badge>
                </div>
                <h2 className="mt-4 line-clamp-2 text-base font-medium">{project.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {project.contents?.length ?? project.outputs.length} generated pieces
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{format(new Date(project.createdAt), "MMM d, yyyy")}</span>
                  <span className="inline-flex items-center gap-1 text-[var(--violet)]">
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-medium">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Analyze your first source from the dashboard to create a project.
            </p>
            <Link className="mt-5 inline-flex h-9 items-center rounded-lg bg-[var(--violet)] px-4 text-sm font-medium text-white" href="/dashboard">
              Go to dashboard
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

async function loadProjects(userId?: string): Promise<Project[]> {
  if (isDemoMode()) return demoProjects;
  if (!userId) return env.requireAuth ? [] : demoProjects;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: { contents: true, hooks: true },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(serializeProject);
  } catch {
    return [];
  }
}
