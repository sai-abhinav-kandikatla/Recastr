"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  handler: () => void;
};

export function RazorpayButton({
  plan,
  interval,
  className,
  label = "Upgrade",
  onSuccess,
}: {
  plan: "PRO" | "TEAM" | "AGENCY";
  interval: "monthly" | "annual";
  className?: string;
  label?: string;
  onSuccess?: () => void;
}) {
  async function startCheckout() {
    const response = await fetch("/api/razorpay/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    const data = (await response.json()) as {
      orderId?: string;
      amount?: number;
      currency?: string;
      key?: string;
      error?: string;
    };
    if (!response.ok || !data.orderId || !data.key || !data.amount) {
      toast.error(data.error ?? "Razorpay checkout failed");
      return;
    }

    if (data.orderId.startsWith("order_demo") || data.key === "rzp_test_demo") {
      toast.success("Demo checkout ready");
      onSuccess?.();
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded || !window.Razorpay) {
      toast.error("Razorpay checkout script could not be loaded");
      return;
    }
    new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency ?? "INR",
      order_id: data.orderId,
      name: "Recastr",
      handler: () => {
        toast.success("Payment successful, plan upgraded!");
        onSuccess?.();
      },
    }).open();
  }

  return (
    <Button className={cn(className)} onClick={startCheckout}>
      {label}
    </Button>
  );
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
