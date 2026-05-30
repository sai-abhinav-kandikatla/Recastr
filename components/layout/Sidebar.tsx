"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Folder,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/tasks", label: "Tasks & Queue", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  projects,
  user,
}: {
  projects: Project[];
  user?: CurrentUser | null;
}) {
  const pathname = usePathname();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Demo creator";
  const plan = user?.plan ?? "FREE";

  return (
    <>
      <aside className="hidden h-screen w-[var(--sidebar-w)] shrink-0 flex-col overflow-hidden border-r bg-[#0f172a] text-white lg:flex">
        <div className="flex h-[var(--topbar-h)] items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--violet)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Recastr</p>
            <p className="text-[11px] text-slate-400">AI content studio</p>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <SidebarLink
              key={`${item.href}-${item.label}`}
              active={isActive(pathname, item.href, item.label)}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div className="border-y border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Projects
            </p>
            <Badge className="bg-white/10 text-white ring-white/10" variant="muted">
              {projects.length}
            </Badge>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          {projects.slice(0, 6).map((project) => (
            <Link
              href={`/projects/${project.id}`}
              key={project.id}
              className={cn(
                "group flex gap-3 rounded-lg border border-transparent p-2 transition hover:border-white/10 hover:bg-white/10",
                pathname === `/projects/${project.id}` && "border-violet-300/30 bg-white/10",
              )}
            >
              <Image
                src={project.thumbnailUrl ?? "/og-image.svg"}
                alt=""
                width={38}
                height={38}
                className="h-[38px] w-[38px] shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-100">{project.title}</p>
                <p className="mt-1 text-[11px] capitalize text-slate-500">
                  {project.sourceType.toLowerCase()}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--violet)] text-sm font-medium">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="text-[11px] text-slate-400">{plan.toLowerCase()} plan</p>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-14 grid-cols-5 border-t bg-background/95 px-2 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, item.label);
          return (
            <Link
              aria-label={item.label}
              className={cn(
                "flex items-center justify-center rounded-lg text-muted-foreground",
                active && "text-[var(--violet)]",
              )}
              href={item.href}
              key={`${item.href}-${item.label}-mobile`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarLink({
  active,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white",
        active && "bg-[var(--violet-light)] text-[var(--violet)]",
      )}
    >
      {active ? <span className="absolute left-0 top-2 h-5 w-[3px] rounded-r-sm bg-[var(--violet)]" /> : null}
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string, label: string) {
  if (label === "Projects") return pathname.startsWith("/projects");
  if (href === "/dashboard") return pathname === href && label === "Dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
