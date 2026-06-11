import { createHmac, timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
import { PLAN_RULES } from "@/lib/plans";
import { prisma } from "@/lib/prisma/client";
import type { Plan } from "@/lib/types";

export type BillingInterval = "monthly" | "annual";

export type BillingSummary = {
  currentPlan: Plan;
  subscription: {
    id: string;
    interval: BillingInterval;
    nextBillingAt: string | null;
    plan: Plan;
    status: string;
  } | null;
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    interval: BillingInterval;
    paidAt: string | null;
    plan: Plan;
    receipt: string;
    status: string;
  }>;
};

type RazorpayOrder = {
  amount: number;
  currency: string;
  id: string;
  receipt: string;
  status: string;
};

const PAID_PLANS = ["PRO", "TEAM", "AGENCY"] as const;

export function isPaidPlan(value: Plan): value is Exclude<Plan, "FREE"> {
  return PAID_PLANS.includes(value as Exclude<Plan, "FREE">);
}

export function normalizeBillingPlan(value: unknown): Plan {
  const plan = String(value ?? "FREE").toUpperCase();
  if (plan === "PRO" || plan === "TEAM" || plan === "AGENCY") return plan;
  return "FREE";
}

export function normalizeBillingInterval(value: unknown): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

export function getBillingAmountPaise(plan: Plan, interval: BillingInterval) {
  if (plan === "FREE") return 0;
  const rupees = interval === "annual" ? PLAN_RULES[plan].annualPrice : PLAN_RULES[plan].monthlyPrice;
  return rupees * 100;
}

export function getBillingPeriodEnd(start: Date, interval: BillingInterval) {
  const end = new Date(start);
  end.setMonth(end.getMonth() + (interval === "annual" ? 12 : 1));
  return end;
}

export function assertRazorpayConfigured() {
  if (!readSecret(process.env.RAZORPAY_KEY_ID) || !readSecret(process.env.RAZORPAY_KEY_SECRET)) {
    throw new Error("Razorpay is not configured.");
  }
}

export function getPublicRazorpayKey() {
  return readSecret(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) ?? readSecret(process.env.RAZORPAY_KEY_ID);
}

export async function getBillingSummary(userId: string, currentPlan: Plan): Promise<BillingSummary> {
  const [subscription, invoices] = await Promise.all([
    prisma.billingSubscription.findFirst({
      where: { userId, status: { in: ["active", "pending", "past_due"] } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.billingInvoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return {
    currentPlan,
    subscription: subscription
      ? {
          id: subscription.id,
          interval: normalizeBillingInterval(subscription.interval),
          nextBillingAt: subscription.currentPeriodEnd?.toISOString() ?? null,
          plan: normalizeBillingPlan(subscription.plan),
          status: subscription.status,
        }
      : null,
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      interval: normalizeBillingInterval(invoice.interval),
      paidAt: invoice.paidAt?.toISOString() ?? null,
      plan: normalizeBillingPlan(invoice.plan),
      receipt: invoice.receipt,
      status: invoice.status,
    })),
  };
}

export async function createBillingOrder({
  interval,
  plan,
  userEmail,
  userId,
}: {
  interval: BillingInterval;
  plan: Exclude<Plan, "FREE">;
  userEmail: string;
  userId: string;
}) {
  assertRazorpayConfigured();
  const keyId = readSecret(process.env.RAZORPAY_KEY_ID);
  const keySecret = readSecret(process.env.RAZORPAY_KEY_SECRET);
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured.");

  const amount = getBillingAmountPaise(plan, interval);
  const receipt = createReceipt();
  const order = await createRazorpayOrder({
    amount,
    interval,
    keyId,
    keySecret,
    plan,
    receipt,
    userEmail,
    userId,
  });

  const subscription = await prisma.billingSubscription.create({
    data: {
      userId,
      plan: plan.toLowerCase(),
      interval,
      status: "pending",
      razorpayOrderId: order.id,
      metadata: {
        razorpayStatus: order.status,
      },
    },
  });

  const invoice = await prisma.billingInvoice.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      plan: plan.toLowerCase(),
      interval,
      amount,
      currency: order.currency,
      status: "created",
      receipt,
      razorpayOrderId: order.id,
    },
  });

  return {
    amount,
    currency: order.currency,
    description: `${PLAN_RULES[plan].label} ${interval} plan`,
    invoiceId: invoice.id,
    keyId: getPublicRazorpayKey(),
    orderId: order.id,
    plan,
    prefillEmail: userEmail,
    interval,
  };
}

export function verifyCheckoutSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const keySecret = readSecret(process.env.RAZORPAY_KEY_SECRET);
  if (!keySecret) throw new Error("Razorpay key secret is not configured.");
  return verifyHmacSignature(`${orderId}|${paymentId}`, signature, keySecret);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const webhookSecret = readSecret(process.env.RAZORPAY_WEBHOOK_SECRET);
  if (!webhookSecret) throw new Error("Razorpay webhook secret is not configured.");
  if (!signature) return false;
  return verifyHmacSignature(rawBody, signature, webhookSecret);
}

export async function activatePaidPlan({
  expectedUserId,
  orderId,
  paymentId,
  signature,
}: {
  expectedUserId?: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
}) {
  const invoice = await prisma.billingInvoice.findUnique({
    where: { razorpayOrderId: orderId },
    include: { subscription: true },
  });
  if (!invoice) throw new Error("Billing invoice not found.");
  if (expectedUserId && invoice.userId !== expectedUserId) throw new Error("Billing invoice not found.");
  if (invoice.status === "paid") {
    return getBillingSummary(invoice.userId, normalizeBillingPlan(invoice.plan));
  }

  const plan = normalizeBillingPlan(invoice.plan);
  if (!isPaidPlan(plan)) throw new Error("Invalid paid plan.");
  const subscriptionId = invoice.subscriptionId ?? invoice.subscription?.id;
  if (!subscriptionId) throw new Error("Billing subscription not found.");
  const interval = normalizeBillingInterval(invoice.interval);
  const now = new Date();
  const periodEnd = getBillingPeriodEnd(now, interval);

  await prisma.$transaction([
    prisma.billingSubscription.updateMany({
      where: {
        userId: invoice.userId,
        status: "active",
        id: { not: subscriptionId },
      },
      data: { status: "cancelled", cancelledAt: now },
    }),
    prisma.billingInvoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        paidAt: now,
        failReason: null,
      },
    }),
    prisma.billingSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: "active",
        razorpayPaymentId: paymentId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.user.update({
      where: { id: invoice.userId },
      data: {
        plan: plan.toLowerCase(),
        planExpiresAt: periodEnd,
      },
    }),
  ]);

  return getBillingSummary(invoice.userId, plan);
}

export async function markBillingOrderFailed(orderId: string | undefined, reason: string) {
  if (!orderId) return;
  const invoice = await prisma.billingInvoice.findUnique({
    where: { razorpayOrderId: orderId },
    select: { id: true, subscriptionId: true },
  });
  if (!invoice) return;

  await prisma.$transaction([
    prisma.billingInvoice.update({
      where: { id: invoice.id },
      data: { status: "failed", failedAt: new Date(), failReason: reason },
    }),
    ...(invoice.subscriptionId
      ? [
          prisma.billingSubscription.update({
            where: { id: invoice.subscriptionId },
            data: { status: "failed" },
          }),
        ]
      : []),
  ]);
}

export async function downgradeToFree(userId: string) {
  await prisma.$transaction([
    prisma.billingSubscription.updateMany({
      where: { userId, status: { in: ["active", "pending", "past_due"] } },
      data: { status: "cancelled", cancelledAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: "free", planExpiresAt: null },
    }),
  ]);
}

export async function recordBillingEvent({
  eventId,
  eventType,
  payload,
  userId,
}: {
  eventId: string;
  eventType: string;
  payload: unknown;
  userId?: string | null;
}) {
  return prisma.billingEvent.upsert({
    where: { eventId },
    create: {
      eventId,
      eventType,
      payload: payload as Prisma.InputJsonValue,
      userId: userId ?? undefined,
    },
    update: {},
  });
}

export async function markBillingEventProcessed(eventId: string, userId?: string | null) {
  await prisma.billingEvent.update({
    where: { eventId },
    data: {
      processed: true,
      processedAt: new Date(),
      userId: userId ?? undefined,
    },
  });
}

export function extractWebhookOrderId(payload: unknown) {
  const record = asRecord(payload);
  const payment = asRecord(asRecord(asRecord(record.payload).payment).entity);
  const order = asRecord(asRecord(asRecord(record.payload).order).entity);
  return stringValue(payment.order_id) ?? stringValue(order.id);
}

export function extractWebhookPaymentId(payload: unknown) {
  const record = asRecord(payload);
  const payment = asRecord(asRecord(asRecord(record.payload).payment).entity);
  return stringValue(payment.id);
}

export function extractWebhookEvent(payload: unknown) {
  return stringValue(asRecord(payload).event) ?? "unknown";
}

async function createRazorpayOrder({
  amount,
  interval,
  keyId,
  keySecret,
  plan,
  receipt,
  userEmail,
  userId,
}: {
  amount: number;
  interval: BillingInterval;
  keyId: string;
  keySecret: string;
  plan: Exclude<Plan, "FREE">;
  receipt: string;
  userEmail: string;
  userId: string;
}) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes: {
        interval,
        plan,
        userEmail,
        userId,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as Partial<RazorpayOrder> | null;
  if (!response.ok || !payload?.id || !payload.currency || !payload.amount) {
    throw new Error("Could not create Razorpay order.");
  }
  return payload as RazorpayOrder;
}

function createReceipt() {
  return `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 40);
}

function verifyHmacSignature(message: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(message).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function readSecret(value: string | undefined) {
  const stripped = value?.trim().replace(/^['"]|['"]$/g, "");
  return stripped || undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
