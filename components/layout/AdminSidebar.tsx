"use client";

import { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  CreditCard,
  LineChart,
  ShieldAlert,
  Settings,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert },
  { href: "/admin/system", label: "System", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="z-20 hidden h-screen w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-[var(--app-line)] bg-[var(--app-bg)] text-[var(--app-text)] lg:flex">
        <div className="flex h-[var(--topbar-height)] items-center gap-2.5 border-b border-[var(--app-line)] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-display text-[15px] font-semibold tracking-tight">Recastr Admin</p>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">System Control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto scrollbar-thin">
          {adminNavItems.map((item) => (
            <AdminSidebarLink
              key={`${item.href}-${item.label}`}
              active={isActive(pathname, item.href)}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div className="border-t border-[var(--app-line)] p-4">
          <Link
            href="/dashboard"
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--app-line)] bg-[var(--app-surface)] text-sm font-medium text-foreground transition-colors hover:bg-[var(--app-panel)]"
          >
            <Sparkles className="h-4 w-4 text-[var(--violet)]" />
            Exit to App
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-4 border-t border-[var(--app-line)] bg-[var(--app-bg)] px-2 lg:hidden">
        {adminNavItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              aria-label={item.label}
              className="relative flex flex-col items-center justify-center gap-1 group"
              href={item.href}
              key={`${item.href}-${item.label}-mobile`}
            >
              {active && (
                <div className="absolute inset-x-4 top-0 h-[3px] rounded-b-md bg-orange-500" />
              )}
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                active ? "bg-orange-500/15 text-orange-500" : "text-muted-foreground group-hover:bg-[var(--app-surface)] group-hover:text-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function AdminSidebarLink({
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
        "relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-all duration-200 group overflow-visible",
        active
          ? "bg-[var(--app-panel)] text-orange-500"
          : "text-muted-foreground hover:bg-[var(--app-surface)] hover:text-foreground"
      )}
    >
      {active && (
        <div
          className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-md bg-orange-500"
        />
      )}
      <Icon className={cn(
        "h-[18px] w-[18px] transition-colors",
        active ? "text-primary" : "group-hover:text-foreground"
      )} />
      <span className="relative z-10">{label}</span>
      {!active && <div className="absolute inset-0 rounded-[10px] opacity-0 transition-opacity group-hover:opacity-100" />}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
