import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 13);
    startDate.setHours(0, 0, 0, 0);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const scheduledActiveStatuses = ["pending", "scheduled", "processing"];
    const completedStatuses = ["notified", "published"];
    const failedStatuses = ["failed"];

    const [
      platformRows,
      recentContentItems,
      recentScheduledPosts,
      totalProjects,
      scheduledStatusRows,
    ] = await Promise.all([
      prisma.content.groupBy({
        by: ["platform"],
        where: { project: { userId: user.id } },
        _count: { _all: true },
      }),
      prisma.content.findMany({
        where: { project: { userId: user.id }, createdAt: { gte: oneMonthAgo } },
        select: { createdAt: true },
      }),
      prisma.scheduledPost.findMany({
        where: { userId: user.id, scheduledAt: { gte: oneMonthAgo } },
        select: { scheduledAt: true, status: true },
      }),
      prisma.project.count({
        where: { userId: user.id },
      }),
      prisma.scheduledPost.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: { _all: true },
      }),
    ]);

    // Format metrics
    const platformCounts: Record<string, number> = {
      TWITTER: 0,
      LINKEDIN: 0,
      INSTAGRAM: 0,
      FACEBOOK: 0,
      THREADS: 0,
      CAROUSEL: 0,
      COMMUNITY: 0,
    };

    platformRows.forEach((item) => {
      const p = item.platform.toUpperCase();
      if (p in platformCounts) {
        platformCounts[p] = item._count._all;
      }
    });
    const totalGeneratedPosts = platformRows.reduce((total, item) => total + item._count._all, 0);
    const statusCounts = new Map(
      scheduledStatusRows.map((row) => [row.status.toLowerCase(), row._count._all]),
    );
    const countStatuses = (statuses: string[]) =>
      statuses.reduce((total, status) => total + (statusCounts.get(status) ?? 0), 0);
    const totalScheduled = countStatuses(scheduledActiveStatuses);
    const completedReminders = countStatuses(completedStatuses);
    const failedCount = countStatuses(failedStatuses);

    const last14Days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const chartData = last14Days.map((date) => {
      const created = recentContentItems.filter((item) => {
        const itemDate = new Date(item.createdAt);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === date.getTime();
      }).length;

      const scheduled = recentScheduledPosts.filter((post) => {
        const postDate = new Date(post.scheduledAt);
        postDate.setHours(0, 0, 0, 0);
        return postDate.getTime() === date.getTime();
      }).length;

      return {
        date: date.toISOString(),
        created,
        scheduled,
      };
    });

    const contentToday = recentContentItems.filter((item) => item.createdAt >= oneDayAgo).length;
    const contentWeekly = recentContentItems.filter((item) => item.createdAt >= oneWeekAgo).length;
    const scheduledToday = recentScheduledPosts.filter((post) => post.scheduledAt >= oneDayAgo).length;
    const scheduledWeekly = recentScheduledPosts.filter((post) => post.scheduledAt >= oneWeekAgo).length;
    const todayActivity = contentToday + scheduledToday;
    const weeklyActivity = contentWeekly + scheduledWeekly;
    const monthlyActivity = recentContentItems.length + recentScheduledPosts.length;

    // Top platform
    let topPlatform = "None";
    let maxCount = 0;
    Object.entries(platformCounts).forEach(([platform, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topPlatform = platform;
      }
    });

    // Success rate
    const successRate = completedReminders + failedCount > 0
      ? Math.round((completedReminders / (completedReminders + failedCount)) * 100)
      : 0;

    return NextResponse.json({
      totalGeneratedPosts,
      totalProjects,
      totalScheduledPosts: totalScheduled,
      completedReminders,
      platformCounts,
      chartData,
      todayActivity,
      weeklyActivity,
      monthlyActivity,
      topPlatform,
      generationSuccessRate: Math.min(100, Math.max(0, successRate)),
      averageGenerationTimeSeconds: 0,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GET /api/analytics failed:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
