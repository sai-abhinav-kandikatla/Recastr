"use client";

import type React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Play,
  Sparkles,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { RazorpayButton } from "@/components/billing/RazorpayButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

const tabs = {
  Tweets: [
    "Your best hooks are not in your content calendar. They are buried in the source.",
    "Repurposing is translation, not resizing.",
  ],
  LinkedIn: [
    "Most creators do not need more ideas.\n\nThey need a cleaner way to extract the strongest moments from work they already did.",
  ],
  Reels: [
    "Hook: Stop starting from blank pages.\nValue: Pull tension, proof, and transformation from one source.\nCTA: Save this workflow.",
  ],
  Captions: [
    "One source can become a campaign when the hook comes first and the format comes second.",
  ],
};

const testimonials = [
  ["AM", "Founder", "Recastr turned our weekly podcast into a complete launch calendar."],
  ["RK", "YouTuber", "The hook ranking feels like having a strategist in the editing room."],
  ["NS", "Agency", "Client content reviews became faster because the first draft is actually usable."],
  ["JV", "Coach", "I stopped staring at blank pages after every recording."],
  ["LT", "Creator", "The outputs sound platform-native instead of recycled."],
  ["MP", "Marketer", "The demo mode alone is pitch-ready."],
];

export function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof typeof tabs>("Tweets");

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">{copy.product.name}</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features">{copy.navigation.features}</a>
            <a href="#pricing">{copy.navigation.pricing}</a>
            <button onClick={() => setDemoOpen(true)}>{copy.navigation.demo}</button>
          </div>
          <Button asChild className="bg-white text-slate-950 hover:bg-slate-200">
            <Link href="/onboarding">{copy.product.primaryCta}</Link>
          </Button>
        </div>
      </nav>

      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.42),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0),#020617_88%)]" />
        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1fr_520px] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="bg-white/10 text-violet-100 ring-white/15">
              <Zap className="mr-1 h-3 w-3" />
              Viral hook intelligence
            </Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-medium leading-[1.02] tracking-normal sm:text-7xl">
              {copy.product.hero}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{copy.product.tagline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90">
                <Link href="/onboarding">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => setDemoOpen(true)}>
                <Play className="h-4 w-4" />
                Watch demo
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.55 }}
          >
            <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl">
              {[
                ["X thread", "Most creators do not need more ideas. They need a better extraction system."],
                ["LinkedIn", "The strongest post is usually hiding in the part of the interview that felt uncomfortable."],
                ["Reel", "Hook: Your next month of content is already recorded."],
              ].map(([label, text], index) => (
                <motion.div
                  key={label}
                  className="mb-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.12 }}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-violet-300">{label}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100">{text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-5 text-sm text-slate-300 lg:px-8">
          <span>{copy.landing.proof}</span>
          {["X", "LinkedIn", "Instagram", "YouTube"].map((platform) => (
            <span key={platform} className="rounded-full border border-white/10 px-3 py-1">
              {platform}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Paste URL", "Add a YouTube video, podcast, blog, or raw text source."],
            ["AI extracts hooks", "Find viral moments, emotional tension, and opening lines."],
            ["Export 30-day pack", "Generate platform-ready content and copy or export instantly."],
          ].map(([title, body], index) => (
            <Card key={title} className="border-white/10 bg-white/[0.04] text-white">
              <CardContent>
                <span className="text-sm text-violet-300">0{index + 1}</span>
                <h2 className="mt-4 text-2xl font-medium tracking-normal">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[360px_1fr] lg:px-8">
        <div>
          <Badge className="bg-white/10 text-slate-200 ring-white/10">Output showcase</Badge>
          <h2 className="mt-5 text-4xl font-medium tracking-normal">Generated assets that feel native</h2>
          <p className="mt-4 text-slate-400">Switch formats and copy any sample into your swipe file.</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(tabs) as Array<keyof typeof tabs>).map((tab) => (
              <button
                key={tab}
                className={cn("rounded-full px-4 py-2 text-sm text-slate-300", activeTab === tab && "bg-white text-slate-950")}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="mt-4 grid gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {tabs[activeTab].map((sample) => (
                <div key={sample} className="rounded-2xl bg-slate-950/80 p-4 text-sm leading-7 text-slate-100">
                  {sample}
                  <Button size="sm" variant="ghost" className="mt-3 text-slate-300">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-violet-950/80 to-slate-950 p-8 md:p-12">
          <Badge className="bg-white/10 text-violet-100 ring-white/15">Signature feature</Badge>
          <h2 className="mt-5 max-w-3xl text-4xl font-medium tracking-normal">{copy.landing.hookCallout}</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {["The uncomfortable admission", "The counterintuitive claim", "The measurable transformation"].map((hook, index) => (
              <motion.div
                key={hook}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                initial={{ opacity: 0, x: 22 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-sm text-violet-200">Hook {index + 1}</p>
                <p className="mt-3 text-lg leading-7">{hook}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <h2 className="text-4xl font-medium tracking-normal">Simple pricing</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            ["Free", "₹0", "3 projects/mo", null],
            ["Pro", "₹999/mo", "Unlimited projects + scheduling", "PRO"],
            ["Team", "₹2999/mo", "Collaboration and client workflows", "TEAM"],
          ].map(([name, price, body, plan]) => (
            <Card key={name} className={cn("border-white/10 bg-white/[0.04] text-white", name === "Pro" && "ring-2 ring-primary")}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-medium">{name}</h3>
                  {name === "Pro" ? <Badge>Most popular</Badge> : null}
                </div>
                <p className="mt-4 text-4xl font-medium">{price}</p>
                <p className="mt-3 text-sm text-slate-400">{body}</p>
                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  {["Viral hook intelligence", "Platform-native outputs", "Copy and export tools"].map((feature) => (
                    <p key={feature} className="flex gap-2">
                      <Check className="h-4 w-4 text-teal-300" />
                      {feature}
                    </p>
                  ))}
                </div>
                {plan ? (
                  <RazorpayButton className="mt-6 w-full" interval="monthly" label={`Choose ${name}`} plan={plan as "PRO" | "TEAM"} />
                ) : (
                  <Button asChild className="mt-6 w-full bg-white text-slate-950 hover:bg-slate-200">
                    <Link href="/onboarding">Start free</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map(([avatar, role, quote]) => (
            <Card key={quote} className="border-white/10 bg-white/[0.04] text-white">
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/20 text-sm">{avatar}</span>
                  <span className="text-sm text-slate-400">{role}</span>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-200">&quot;{quote}&quot;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <h2 className="text-3xl font-medium tracking-normal">FAQ</h2>
        <div className="mt-6 divide-y divide-white/10 rounded-[24px] border border-white/10">
          {copy.landing.faq.map(([question, answer]) => (
            <details key={question} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                {question}
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-400">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-10 text-sm text-slate-400 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>Recastr. AI content command center.</p>
          <div className="flex gap-4">
            <Link href="/login">Login</Link>
            <Link href="/settings">Billing</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {demoOpen ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <p className="text-sm font-medium">90-second product demo</p>
                <Button aria-label="Close demo" size="icon" variant="ghost" onClick={() => setDemoOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid aspect-video place-items-center bg-gradient-to-br from-slate-900 to-violet-950">
                <div className="text-center">
                  <Video className="mx-auto h-10 w-10 text-violet-200" />
                  <p className="mt-4 text-xl font-medium">Paste source. Extract hooks. Generate pack.</p>
                  <p className="mt-2 text-sm text-slate-400">Embedded demo placeholder for the pitch flow.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
