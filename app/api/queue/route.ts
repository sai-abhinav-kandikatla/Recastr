import { ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import { getRequestUser } from "@/lib/auth";
import { demoProjects, demoScheduledPosts } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!isDemoMode()) {
      const queue = await prisma.content.findMany({
        where: {
          approved: true,
          scheduledPost: null,
          project: { userId: user.id },
        },
        include: {
          project: { select: { title: true } },
        },
        orderBy: { order: "asc" },
      });

      return ok(
        queue.map((content) => ({
          id: content.id,
          projectId: content.projectId,
          hookId: content.hookId,
          platform: content.platform,
          contentType: content.contentType,
          body: content.body,
          originalBody: content.originalBody,
          tone: content.tone,
          approved: content.approved,
          order: content.order,
          scheduledPost: null,
          createdAt: content.createdAt.toISOString(),
          projectTitle: content.project.title,
        })),
      );
    }

    const scheduledIds = new Set(demoScheduledPosts.map((post) => post.contentId).filter(Boolean));
    const queue = demoProjects.flatMap((project) =>
      (project.contents ?? [])
        .filter((content) => content.approved && !scheduledIds.has(content.id))
        .map((content) => ({
          ...content,
          projectTitle: project.title,
        })),
    );

    return ok(queue);
  } catch (error) {
    return apiError(error, "queue_fetch_failed", 500);
  }
}
