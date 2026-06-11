"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

type RazorpayOrderResponse = {
  amount: number;
  currency: string;
  description: string;
  interval: "monthly" | "annual";
  keyId: string;
  orderId: string;
  plan: Exclude<Plan, "FREE">;
  prefillEmail?: string;
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayInstance = {
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
  open: () => void;
};

type RazorpayConstructor = new (options: {
  amount: number;
  currency: string;
  description: string;
  handler: (response: RazorpayPaymentResponse) => void;
  key: string;
  modal?: { ondismiss?: () => void };
  name: string;
  order_id: string;
  prefill?: { email?: string };
  theme?: { color: string };
}) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export function RazorpayButton({
  className,
  interval,
  label = "Upgrade",
  onSuccess,
  plan,
}: {
  plan: Exclude<Plan, "FREE">;
  interval: "monthly" | "annual";
  className?: string;
  label?: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        toast.error("Could not load Razorpay checkout. Try again.");
        return;
      }

      const order = await postJson<RazorpayOrderResponse>("/api/razorpay/order", { interval, plan });
      const checkout = new window.Razorpay({
        amount: order.amount,
        currency: order.currency,
        description: order.description,
        key: order.keyId,
        name: "Recastr",
        order_id: order.orderId,
        prefill: { email: order.prefillEmail },
        theme: { color: "#7C3AED" },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response) => {
          try {
            await postJson("/api/razorpay/verify", response);
            toast.success("Payment verified. Your plan is active.");
            onSuccess?.();
          } catch {
            toast.error("Payment verification failed. Support can verify this from Razorpay.");
          } finally {
            setLoading(false);
          }
        },
      });

      checkout.on("payment.failed", (response) => {
        setLoading(false);
        toast.error(response.error?.description ?? response.error?.reason ?? "Payment failed");
      });
      checkout.open();
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Could not start checkout");
    }
  }

  return (
    <Button className={cn(className)} disabled={loading} onClick={() => void startCheckout()} type="button">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {loading ? "Opening checkout..." : label}
    </Button>
  );
}

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  razorpayScriptPromise ??= new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || payload?.error || !payload?.data) {
    throw new Error(payload?.error?.message ?? "Request failed");
  }
  return payload.data;
}
