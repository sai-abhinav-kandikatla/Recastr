"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center">
      <h2 className="text-lg font-medium">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The tasks view could not load. Try again or return to the dashboard.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mx-auto mt-4 max-w-xl overflow-auto rounded-lg bg-muted p-3 text-left text-xs">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
