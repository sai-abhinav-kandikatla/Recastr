import type React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ViralHook } from "@/lib/types";

export function HookCard({
  hook,
  action,
}: {
  hook: ViralHook;
  action?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-white/10 bg-card/80 shadow-none">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <Badge>{hook.hookType}</Badge>
          <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
            {Math.round(hook.reachScore)}
          </span>
        </div>
        <p className="text-base leading-7">{hook.text}</p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400"
            style={{ width: `${Math.min(100, Math.max(0, hook.reachScore))}%` }}
          />
        </div>
        {action ?? (
          <Button asChild className="w-full" size="sm">
            <Link href={`/projects/${hook.projectId}/generate?hookId=${hook.id}`}>
              Generate from this hook
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
