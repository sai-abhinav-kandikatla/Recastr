import { ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import { getRequestUser } from "@/lib/auth";
import { demoScheduledPosts } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import type { Platform, PostStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    const url = new URL(request.url);
    const filter = url.searchParams.get("filter") ?? "all";
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    if (!isDemoMode()) {
      const posts = await prisma.scheduledPost.findMany({
        where: {
          userId: user.id,
          status: { in: ["pending", "scheduled"] },
        },
        include: { content: true },
        orderBy: { scheduledAt: "asc" },
      });

      return ok(
        posts
          .filter((post) => {
            const timestamp = post.scheduledAt.getTime();
            if (filter === "today") return post.scheduledAt.toDateString() === new Date().toDateString();
            if (filter === "week") return timestamp >= now && timestamp <= now + week;
            return true;
          })
          .map((post) => ({
            id: post.id,
            outputId: post.contentId,
            contentId: post.contentId,
            platform: post.platform as Platform,
            publishAt: post.scheduledAt.toISOString(),
            scheduledAt: post.scheduledAt.toISOString(),
            status: post.status.toUpperCase() as PostStatus,
            title: post.content.body,
            publishedAt: post.publishedAt?.toISOString() ?? null,
            failReason: post.failReason,
          })),
      );
    }

    const posts = demoScheduledPosts.filter((post) => {
      if (!["SCHEDULED", "PENDING"].includes(post.status)) return false;
      const timestamp = new Date(post.publishAt).getTime();
      if (filter === "today") return new Date(post.publishAt).toDateString() === new Date().toDateString();
      if (filter === "week") return timestamp >= now && timestamp <= now + week;
      return true;
    });

    return ok(posts);
  } catch (error) {
    return apiError(error, "scheduled_fetch_failed", 500);
  }
}
