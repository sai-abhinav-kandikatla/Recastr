import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import { activatePaidPlan, verifyCheckoutSignature } from "@/lib/billing";
import { getRequestUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    const parsed = verifySchema.safeParse(await request.json());
    if (!parsed.success) return err("Invalid payment response", "validation_error", 400);

    const isValid = verifyCheckoutSignature({
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
    });
    if (!isValid) return err("Payment verification failed", "payment_signature_invalid", 400);

    const summary = await activatePaidPlan({
      expectedUserId: user.id,
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
    });

    return ok(summary);
  } catch (error) {
    return apiError(error, "payment_verification_failed", 500);
  }
}
