"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, UserCircle } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export function TopBar({
  title,
  sourceBadge,
  user,
}: {
  title: string;
  sourceBadge?: string;
  user?: CurrentUser | null;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const breadcrumb = useMemo(() => makeBreadcrumb(pathname, title, sourceBadge), [pathname, sourceBadge, title]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-h)] items-center gap-4 border-b bg-background/92 px-4 backdrop-blur-sm sm:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {breadcrumb.map((item, index) => (
            <span key={`${item}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? <span className="text-muted-foreground">/</span> : null}
              <span className={cn(index === breadcrumb.length - 1 ? "truncate font-medium text-foreground" : "text-muted-foreground")}>
                {item}
              </span>
            </span>
          ))}
        </div>
        {sourceBadge ? <p className="hidden truncate text-xs text-muted-foreground sm:block">{sourceBadge}</p> : null}
      </div>

      <div className="hidden items-center md:flex">
        <label
          className={cn(
            "flex h-9 items-center overflow-hidden rounded-lg border bg-background transition-all duration-200",
            searchOpen ? "w-60" : "w-36",
          )}
        >
          <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Global search"
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            onBlur={() => setSearchOpen(false)}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search"
          />
          <kbd className="mr-2 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button aria-label="Notifications" className="relative" size="icon" variant="ghost">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--violet)]" />
        </Button>
        <ThemeToggle />
        {user ? (
          <div className="hidden items-center gap-2 rounded-full border bg-card px-2 py-1 text-sm md:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--violet)] text-xs font-medium text-white">
              {(user.name ?? user.email).slice(0, 1).toUpperCase()}
            </div>
            <span className="max-w-32 truncate">{user.name ?? user.email}</span>
            <Badge variant="muted">{user.plan}</Badge>
          </div>
        ) : (
          <Button asChild size="sm" variant="secondary">
            <Link href="/login">
              <UserCircle className="h-4 w-4" />
              Sign in
            </Link>
          </Button>
        )}
        {user ? <LogoutButton /> : null}
      </div>
    </header>
  );
}

function makeBreadcrumb(pathname: string, fallbackTitle: string, sourceBadge?: string) {
  if (pathname.startsWith("/projects/")) return ["Projects", sourceBadge ?? fallbackTitle];
  if (pathname.startsWith("/schedule")) return ["Schedule"];
  if (pathname.startsWith("/tasks")) return ["Tasks & Queue"];
  if (pathname.startsWith("/settings")) return ["Settings"];
  if (pathname.startsWith("/onboarding")) return ["Onboarding"];
  return [fallbackTitle];
}
