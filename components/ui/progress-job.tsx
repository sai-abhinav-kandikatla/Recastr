"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export function ProgressJob({ jobId }: { jobId: string }) {
  const { data } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/status`);
      return (await response.json()) as { status: string; progress: number };
    },
    refetchInterval: (query) => ((query.state.data?.progress ?? 0) >= 100 ? false : 1000),
  });
  const progress = data?.progress ?? 0;

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>{data?.status ?? "pending"}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}
