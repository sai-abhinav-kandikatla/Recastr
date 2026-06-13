"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { TopBar } from "./TopBar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)] font-body text-[var(--app-text)] antialiased selection:bg-[var(--violet)]/30 selection:text-[var(--violet)]">
      <AdminSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar title="Admin Dashboard" onOpenCommandPalette={() => {}} />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--app-line-strong)] pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
