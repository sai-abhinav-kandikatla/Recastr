import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

const planClass: Record<Plan, string> = {
  FREE: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
  PRO: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  TEAM: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  AGENCY: "bg-cyan-500/10 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300",
};

export function PlanBadge({ plan, className }: { plan: Plan; className?: string }) {
  return (
    <Badge className={cn(planClass[plan], className)} variant="muted">
      {plan.toLowerCase()}
    </Badge>
  );
}
