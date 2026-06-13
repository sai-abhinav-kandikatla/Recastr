import { Suspense } from "react";
import { Users, CreditCard, Building2, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">High-level metrics and platform health.</p>
      </div>

      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>
    </div>
  );
}

async function DashboardMetrics() {
  const [totalUsers, activeOrgs, totalProjects, subscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.project.count(),
    prisma.billingSubscription.findMany({
      where: { status: "active" },
      include: { invoices: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  // Calculate MRR from active subscriptions (assuming monthly interval and INR)
  const mrr = subscriptions.reduce((acc, sub) => {
    const latestInvoice = sub.invoices[0];
    if (latestInvoice && sub.interval === "monthly") {
      return acc + (latestInvoice.amount / 100); // Assuming amount is in paise/cents
    }
    if (latestInvoice && sub.interval === "yearly") {
      return acc + (latestInvoice.amount / 100 / 12);
    }
    return acc;
  }, 0);

  const metrics = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      change: "+12%", // Placeholder
      icon: Users,
    },
    {
      title: "Active Organizations",
      value: activeOrgs.toLocaleString(),
      change: "+5%",
      icon: Building2,
    },
    {
      title: "Total Content Projects",
      value: totalProjects.toLocaleString(),
      change: "+18%",
      icon: TrendingUp,
    },
    {
      title: "Estimated MRR",
      value: `₹${Math.round(mrr).toLocaleString()}`,
      change: "+8%",
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.title} className="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-panel)] text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-2xl font-semibold">{metric.value}</p>
              <span className="text-xs font-medium text-emerald-500">{metric.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[120px] rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6">
          <div className="h-10 w-full animate-pulse rounded bg-[var(--app-panel)]" />
          <div className="mt-4 h-8 w-1/2 animate-pulse rounded bg-[var(--app-panel)]" />
        </div>
      ))}
    </div>
  );
}
