import { err, ok } from "@/lib/api-response";
import { apiError } from "@/lib/api/response";
import {
  activatePaidPlan,
  extractWebhookEvent,
  extractWebhookOrderId,
  extractWebhookPaymentId,
  markBillingEventProcessed,
  markBillingOrderFailed,
  recordBillingEvent,
  verifyWebhookSignature,
} from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      return err("Invalid webhook signature", "webhook_signature_invalid", 400);
    }

    const payload = JSON.parse(rawBody) as unknown;
    const eventType = extractWebhookEvent(payload);
    const eventId = request.headers.get("x-razorpay-event-id") ?? `${eventType}:${extractWebhookOrderId(payload) ?? Date.now()}`;
    const event = await recordBillingEvent({ eventId, eventType, payload });
    if (event.processed) return ok({ duplicate: true });

    const orderId = extractWebhookOrderId(payload);
    const paymentId = extractWebhookPaymentId(payload);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      if (orderId) await activatePaidPlan({ orderId, paymentId });
    }

    if (eventType === "payment.failed") {
      await markBillingOrderFailed(orderId, "Razorpay payment failed");
    }

    await markBillingEventProcessed(eventId);
    return ok({ processed: true, eventType });
  } catch (error) {
    return apiError(error, "razorpay_webhook_failed", 500);
  }
}
