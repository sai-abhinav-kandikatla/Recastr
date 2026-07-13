"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DataLoadError({
  title = "Workspace temporarily unavailable",
  message = "We could not load your data. Your projects are still safe.",
}: {
  title?: string;
  message?: string;
}) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center border-y border-[var(--app-line)] py-16 text-center">
      <AlertCircle className="h-10 w-10 text-red-400" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
      <Button
        className="mt-6"
        disabled={isRetrying}
        onClick={() => startTransition(() => router.refresh())}
        type="button"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
        {isRetrying ? "Retrying..." : "Retry"}
      </Button>
    </div>
  );
}
