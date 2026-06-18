"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

const items = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: Sparkles,
    label: "Generate",
    href: "/generate",
  },
  {
    icon: FolderOpen,
    label: "Projects",
    href: "/projects",
  },
  {
    icon: Calendar,
    label: "Schedule",
    href: "/schedule",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export function Sidebar() {
  return (
    <aside className="w-[260px] border-r border-[#232323] bg-[#090909] p-6">

      <h1 className="mb-12 text-2xl font-semibold text-white">
        Recastr
      </h1>

      <nav className="space-y-2">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex h-12 items-center gap-4 rounded-2xl px-4 text-[#8A8A8A] transition hover:bg-[#151515] hover:text-white"
            >
              <Icon className="h-5 w-5" />

              <span>{item.label}</span>
            </Link>
          );
        })}

      </nav>

    </aside>
  );
}
