import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GeneratorWorkspace } from "@/components/generator/GeneratorWorkspace";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma/client";
import { projectShellSelect, serializeProjectShell } from "@/lib/projects/serialize";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Generate Content",
  description: "Paste a YouTube URL, podcast episode, blog post, or raw text and generate platform-ready social content in seconds.",
  openGraph: {
    title: "Generate Content | Recastr",
    description: "Turn any source into Twitter threads, LinkedIn posts, Instagram captions, and more.",
  },
  twitter: {
    title: "Generate Content | Recastr",
    description: "Turn any source into Twitter threads, LinkedIn posts, Instagram captions, and more.",
  },
};

export default async function GeneratePage() {
  const user = await getCurrentUser();
  const projects = await loadRecentProjects(user?.id);

  return (
    <AppShell projects={projects} title="Generator Workspace" sourceBadge="New Content" user={user}>
      <div className="p-6">
        <PageHeader title="Generator Workspace" backHref="/dashboard" />
        <GeneratorWorkspace project={null} initialHistory={projects} />
      </div>
    </AppShell>
  );
}

async function loadRecentProjects(userId?: string): Promise<Project[]> {
  if (!userId) return [];

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      select: projectShellSelect,
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return projects.map(serializeProjectShell);
  } catch (error) {
    console.error("Failed to load recent projects:", error);
    return [];
  }
}
