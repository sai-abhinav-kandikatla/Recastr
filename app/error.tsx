"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("GLOBAL CRASH - Full error:", {
    message: error?.message,
    stack: error?.stack,
    name: error?.name,
    digest: error?.digest,
  });

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="max-w-md rounded-[28px] border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-medium tracking-normal">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We couldn&apos;t load this page. Try again, and if the issue persists
          please contact{" "}
          <a href="mailto:support@recastr.app" className="font-medium text-primary hover:underline">
            support@recastr.app
          </a>{" "}
          with the details below.
        </p>
        {error.digest ? (
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
