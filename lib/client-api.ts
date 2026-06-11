"use client";

import type { ScheduledPost } from "@/lib/types";

type CreditPayload = {
  error?: string | { code?: string; message?: string };
  code?: string;
  credits?: number;
  upgradeUrl?: string;
};

export async function readApiJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as CreditPayload;
  if (isCreditExhausted(response, payload)) {
    emitCreditExhausted(payload);
    throw new Error("credit_exhausted");
  }
  if (!response.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message ?? `Request failed with ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function assertApiOk(response: Response) {
  if (response.ok) return;
  const payload = (await response.json().catch(() => ({}))) as CreditPayload;
  if (isCreditExhausted(response, payload)) {
    emitCreditExhausted(payload);
    throw new Error("credit_exhausted");
  }
  const message =
    typeof payload.error === "string"
      ? payload.error
      : payload.error?.message ?? `Request failed with ${response.status}`;
  throw new Error(message);
}

export function emitCreditExhausted(payload: CreditPayload = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("recastr:credit-exhausted", {
      detail: {
        credits: payload.credits ?? 0,
        upgradeUrl: payload.upgradeUrl ?? "/settings?tab=billing",
      },
    }),
  );
}

export function emitScheduleCreated(post: ScheduledPost) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("recastr:schedule-created", {
      detail: { post },
    }),
  );
}

function isCreditExhausted(response: Response, payload: CreditPayload) {
  const nestedCode = typeof payload.error === "object" ? payload.error.code : undefined;
  return response.status === 403 && (payload.code === "credit_exhausted" || nestedCode === "credit_exhausted");
}
