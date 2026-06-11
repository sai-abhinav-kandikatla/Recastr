import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import { downgradeToFree, getBillingSummary, normalizeBillingPlan } from "@/lib/billing";
import { getRequestUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const billingUpdateSchema = z.object({
  plan: z.literal("FREE"),
});

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    return ok(await getBillingSummary(user.id, user.plan));
  } catch (error) {
    return apiError(error, "billing_fetch_failed", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getRequestUser(request);
    const parsed = billingUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return err("Invalid billing update", "validation_error", 400);

    await downgradeToFree(user.id);
    return ok(await getBillingSummary(user.id, normalizeBillingPlan(parsed.data.plan)));
  } catch (error) {
    return apiError(error, "billing_update_failed", 500);
  }
}
