import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import {
  createBillingOrder,
  isPaidPlan,
  normalizeBillingInterval,
  normalizeBillingPlan,
} from "@/lib/billing";
import { getRequestUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const orderSchema = z.object({
  interval: z.enum(["monthly", "annual"]).default("monthly"),
  plan: z.enum(["PRO", "TEAM", "AGENCY"]),
});

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    const parsed = orderSchema.safeParse(await request.json());
    if (!parsed.success) return err("Invalid billing request", "validation_error", 400);

    const plan = normalizeBillingPlan(parsed.data.plan);
    if (!isPaidPlan(plan)) return err("Invalid paid plan", "invalid_plan", 400);

    const order = await createBillingOrder({
      interval: normalizeBillingInterval(parsed.data.interval),
      plan,
      userEmail: user.email,
      userId: user.id,
    });

    if (!order.keyId) return err("Razorpay public key is not configured", "razorpay_not_configured", 500);
    return ok(order);
  } catch (error) {
    return apiError(error, "razorpay_order_failed", 500);
  }
}
