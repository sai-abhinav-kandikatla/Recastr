import { err, ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import { env } from "@/lib/env";
import { processDueScheduledNotifications } from "@/lib/scheduled-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (env.CRON_SECRET && authorization !== `Bearer ${env.CRON_SECRET}`) {
      return err("Unauthorized cron request", "unauthorized", 401);
    }

    const result = await processDueScheduledNotifications({ limit: 100 });
    return ok(result);
  } catch (error) {
    return apiError(error, "scheduled_notifications_cron_failed", 500);
  }
}
