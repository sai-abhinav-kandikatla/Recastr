import { z } from "zod";
import { err, ok } from "@/lib/api-response";

export const runtime = "nodejs";

const rescheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = rescheduleSchema.safeParse(await request.json());
  if (!parsed.success) return err("Invalid schedule time", "validation_error", 400);

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (scheduledAt.getTime() <= Date.now()) {
    return err("scheduledAt must be in the future", "invalid_schedule_time", 400);
  }

  return ok({
    id: params.id,
    scheduledAt: scheduledAt.toISOString(),
    publishAt: scheduledAt.toISOString(),
    status: "SCHEDULED",
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return ok({
    id: params.id,
    status: "CANCELLED",
  });
}
