"use client";

import { motion } from "framer-motion";
import { Activity, Flame, Gauge, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { getViralHookInsights } from "@/lib/viral-hooks";
import type { SourceSummary } from "@/lib/types";

export function ViralHookIntelligence({ summary }: { summary: SourceSummary }) {
  const insights = getViralHookInsights(summary);
  const topScore = insights[0]?.score ?? 0;

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 text-white shadow-2xl">
      <div className="relative p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(124,58,237,0.34),transparent_30%),radial-gradient(circle_at_92%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
        <div className="relative">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge className="bg-white/10 text-violet-100 ring-white/15">
                <Sparkles className="mr-1 h-3 w-3" />
                Signature feature
              </Badge>
              <h2 className="mt-4 text-2xl font-medium tracking-normal sm:text-3xl">
                Viral hook intelligence
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Recastr ranks the source moments most likely to stop the scroll, then turns
                them into opening lines for X threads, LinkedIn posts, captions, and community prompts.
              </p>
            </div>
            <div className="grid min-w-44 grid-cols-2 gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              <Metric icon={Gauge} label="top score" value={`${topScore}`} />
              <Metric icon={Activity} label="hooks" value={`${insights.length}`} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.article
                key={insight.hook}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.06 }}
                className="rounded-2xl bg-white/[0.065] p-4 ring-1 ring-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <Flame className="mt-1 h-4 w-4 shrink-0 text-orange-300" />
                  <span className="rounded-full bg-violet-electric px-2 py-1 text-xs text-white">
                    {insight.score}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-white">{insight.hook}</p>
                <p className="mt-3 text-xs text-violet-200">{insight.driver}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{insight.suggestion}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <Icon className="h-4 w-4 text-violet-300" />
      <p className="mt-3 text-xl font-medium">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}
