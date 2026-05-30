export const qk = {
  projects: () => ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  hooks: (projectId: string) => ["projects", projectId, "hooks"] as const,
  content: (projectId: string, hookId?: string) =>
    ["projects", projectId, "content", hookId ?? "all"] as const,
  queue: () => ["queue"] as const,
  scheduled: (filter: string) => ["scheduled", filter] as const,
  history: (page: number) => ["history", page] as const,
  profile: () => ["profile"] as const,
};
