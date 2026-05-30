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
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const platform = url.searchParams.get("platform");
    const status = url.searchParams.get("status");
    const pageSize = 20;
    if (!isDemoMode()) {
      const where = {
        userId: user.id,
        status: {
          in: ["published", "failed", "cancelled"],
        },
        ...(platform ? { platform: platform.toUpperCase() } : {}),
        ...(status ? { status: status.toLowerCase() } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.scheduledPost.findMany({
          where,
          include: { content: true },
          orderBy: { scheduledAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.scheduledPost.count({ where }),
      ]);

      return ok({
        items: items.map((post) => ({
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
        page,
        pageSize,
        total,
      });
    }

    const items = demoScheduledPosts
      .filter((post) => ["PUBLISHED", "FAILED", "CANCELLED"].includes(post.status))
      .filter((post) => (platform ? post.platform.toLowerCase() === platform.toLowerCase() : true))
      .filter((post) => (status ? post.status.toLowerCase() === status.toLowerCase() : true))
      .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime());
    const start = (page - 1) * pageSize;

    return ok({
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total: items.length,
    });
  } catch (error) {
    return apiError(error, "history_fetch_failed", 500);
  }
}
