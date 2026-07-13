import { err, ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import { getRequestUser } from "@/lib/auth";
import { assertEmailTransportReady } from "@/lib/email";
import { prisma } from "@/lib/prisma/client";
import { retryStoredScheduledPost } from "@/lib/projects/store";
import { addRecastrJob, jobNames } from "@/lib/queue/client";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getRequestUser(request);
    if (isLocalScheduleId(id)) {
      const post = retryStoredScheduledPost(id);
      if (!post) return err("Scheduled post not found", "scheduled_post_not_found", 404);
      return ok({
        id,
        status: "PENDING",
      });
    }

    const post = await prisma.scheduledPost.findFirst({
      where: { id, userId: user.id },
      select: { id: true, scheduledAt: true },
    });

    if (!post) return err("Scheduled post not found", "scheduled_post_not_found", 404);
    await assertEmailTransportReady();

    await prisma.scheduledPost.update({
      where: { id },
      data: { status: "pending", publishedAt: null, failReason: null },
    });
    await addRecastrJob(
      jobNames.publishPost,
      { scheduledPostId: id },
      Math.max(0, post.scheduledAt.getTime() - Date.now()),
      { required: false },
    );

    return ok({
      id,
      status: "PENDING",
    });
  } catch (error) {
    return apiError(error, "scheduled_retry_failed", 500);
  }
}

function isLocalScheduleId(id: string) {
  return process.env.NODE_ENV !== "production" && id.startsWith("scheduled-demo-");
}
