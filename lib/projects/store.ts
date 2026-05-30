import { demoProjects } from "@/lib/demo/data";
import type { ContentPiece, Project, SocialOutput } from "@/lib/types";

const globalForProjects = globalThis as unknown as {
  recastrProjects?: Map<string, Project>;
};

function getProjectMap() {
  if (!globalForProjects.recastrProjects) {
    globalForProjects.recastrProjects = new Map(
      demoProjects.map((project) => [project.id, project]),
    );
  }
  return globalForProjects.recastrProjects;
}

export function listStoredProjects() {
  return Array.from(getProjectMap().values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getStoredProject(projectId: string) {
  return getProjectMap().get(projectId);
}

export function saveStoredProject(project: Project) {
  getProjectMap().set(project.id, project);
  return project;
}

export function appendStoredOutputs(projectId: string, outputs: SocialOutput[]) {
  const project = getStoredProject(projectId);
  if (!project) return;

  const outputMap = new Map(project.outputs.map((output) => [output.id, output]));
  for (const output of outputs) {
    outputMap.set(output.id, output);
  }

  saveStoredProject({
    ...project,
    outputs: Array.from(outputMap.values()),
    updatedAt: new Date().toISOString(),
  });
}

export function updateStoredContent(
  contentId: string,
  updates: Partial<Pick<ContentPiece, "body" | "approved" | "tone">>,
) {
  const projects = getProjectMap();
  for (const project of Array.from(projects.values())) {
    const contents = project.contents ?? [];
    const content = contents.find((item) => item.id === contentId);
    if (!content) continue;

    const nextContents = contents.map((item) =>
      item.id === contentId ? { ...item, ...updates } : item,
    );
    const nextOutputs = project.outputs.map((output) =>
      output.id === contentId
        ? {
            ...output,
            content: updates.body ?? output.content,
            originalContent: output.originalContent,
            tone: updates.tone ?? output.tone,
            approved: updates.approved ?? output.approved,
          }
        : output,
    );

    saveStoredProject({
      ...project,
      contents: nextContents,
      outputs: nextOutputs,
      updatedAt: new Date().toISOString(),
    });
    return nextContents.find((item) => item.id === contentId);
  }

  return undefined;
}
