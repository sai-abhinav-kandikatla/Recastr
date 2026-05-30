"use client";

import { CreditUpgradeModal } from "@/components/billing/CreditUpgradeModal";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { CurrentUser } from "@/lib/current-user";
import type { Project } from "@/lib/types";

export function AppShell({
  children,
  projects,
  title = "Workspace",
  sourceBadge,
  user,
}: {
  children: React.ReactNode;
  projects: Project[];
  title?: string;
  sourceBadge?: string;
  user?: CurrentUser | null;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page-bg)] text-foreground">
      <Sidebar projects={projects} user={user} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar title={title} sourceBadge={sourceBadge} user={user} />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <CreditUpgradeModal />
    </div>
  );
}
