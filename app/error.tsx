"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="max-w-md rounded-[28px] border bg-card p-6 text-center shadow-soft">
        <p className="text-sm text-muted-foreground">Something went sideways</p>
        <h1 className="mt-3 text-2xl font-medium tracking-normal">Recastr could not load this view.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Try again. If it keeps happening, contact support with the time this happened.</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
