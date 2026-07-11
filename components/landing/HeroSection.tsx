"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Brain,
  Check,
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  Play,
} from "lucide-react";

// Self-contained custom SVG icons for platforms
const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.002 3.002 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.002 3.002 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// Workflow state steps
type WorkflowStage =
  | "uploading"
  | "transcribing"
  | "analyzing"
  | "generating"
  | "scheduled"
  | "idle";

export function HeroSection() {
  const [stage, setStage] = useState<WorkflowStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiTask, setAiTask] = useState("");
  const [tweetDraft, setTweetDraft] = useState("");
  const [linkedinDraft, setLinkedinDraft] = useState("");
  const [instagramDraft, setInstagramDraft] = useState("");

  const targetTweet = "1/ B2B SaaS content operations are shifting. We analyzed 10,000+ hours of video and found direct-value hooks capture 4x more attention...";
  const targetLinkedin = "Last year, we set out to build an automation engine for video creators.\n\nWe discovered that bullet points don't drive engagement: direct hooks perform 4x better...";
  const targetInstagram = "🎬 Video repurposing framework for marketing teams: reduce overhead by 68%. Swipe to read...";

  useEffect(() => {
    let isActive = true;

    const runShowcase = async () => {
      if (!isActive) return;

      // 0. Idle starting state
      setStage("idle");
      setUploadProgress(0);
      setAiTask("");
      setTweetDraft("");
      setLinkedinDraft("");
      setInstagramDraft("");
      await new Promise((r) => setTimeout(r, 1200));
      if (!isActive) return;

      // 1. Uploading Content
      setStage("uploading");
      for (let p = 0; p <= 100; p += 5) {
        await new Promise((r) => setTimeout(r, 60));
        if (!isActive) return;
        setUploadProgress(p);
      }
      await new Promise((r) => setTimeout(r, 500));
      if (!isActive) return;

      // 2. Transcribing & Extracting
      setStage("transcribing");
      setAiTask("Transcribing audio tracks...");
      await new Promise((r) => setTimeout(r, 1000));
      if (!isActive) return;

      setAiTask("Mapping key themes & entities...");
      await new Promise((r) => setTimeout(r, 1000));
      if (!isActive) return;

      setAiTask("Identifying high-reach hooks...");
      await new Promise((r) => setTimeout(r, 800));
      if (!isActive) return;

      // 3. AI Cognitive Engine Processing
      setStage("analyzing");
      setAiTask("Structuring platform-optimized templates...");
      await new Promise((r) => setTimeout(r, 1200));
      if (!isActive) return;

      // 4. Generating Drafts in Parallel
      setStage("generating");
      setAiTask("");
      
      const maxLen = Math.max(targetTweet.length, targetLinkedin.length, targetInstagram.length);
      for (let i = 0; i <= maxLen; i += 4) {
        await new Promise((r) => setTimeout(r, 20));
        if (!isActive) return;
        if (i <= targetTweet.length) setTweetDraft(targetTweet.slice(0, i));
        if (i <= targetLinkedin.length) setLinkedinDraft(targetLinkedin.slice(0, i));
        if (i <= targetInstagram.length) setInstagramDraft(targetInstagram.slice(0, i));
      }
      await new Promise((r) => setTimeout(r, 1000));
      if (!isActive) return;

      // 5. Success Scheduled State
      setStage("scheduled");
      await new Promise((r) => setTimeout(r, 3000));
      if (!isActive) return;

      // Restart Loop
      runShowcase();
    };

    runShowcase();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center py-20 overflow-hidden bg-[#09090B] bg-[linear-gradient(to_right,#23232812_1px,transparent_1px),linear-gradient(to_bottom,#23232812_1px,transparent_1px)] bg-[size:24px_24px]">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04),transparent_60%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* LEFT COLUMN: Head Copy & Call-To-Actions (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-start text-left z-10 space-y-6">
          {/* Confident Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#232328] bg-[#111114] text-[11px] font-semibold uppercase tracking-wider text-violet-400">
            <Sparkles className="w-3.5 h-3.5" />
            One Upload. Unlimited Content.
          </div>

          {/* Huge Display Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold leading-[1.1] text-white tracking-tight font-display">
            Transform Hours of Content into Weeks of Posts.
          </h1>

          {/* Supporting Copy */}
          <p className="text-base text-zinc-400 leading-relaxed max-w-lg">
            Upload your podcast, webinar, or YouTube video. Our cognitive engine transcribes, extracts key insights, and generates platform-optimized social content in seconds.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4 w-full sm:w-auto">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-violet-600/10 border border-violet-500/20" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="secondary" className="h-12 px-6 rounded-xl border border-[#232328] bg-[#111114] hover:bg-zinc-900 text-zinc-300 font-semibold text-sm transition-all duration-300" asChild>
              <a href="#workflow">
                <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                Watch Demo
              </a>
            </Button>
          </div>

          {/* Minimalist Client Trust Indicators */}
          <div className="pt-10 space-y-3.5 w-full">
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-550 font-mono">
              Empowering top marketing teams at
            </p>
            <div className="flex items-center gap-6 text-zinc-600 opacity-60">
              <span className="font-semibold tracking-tight text-xs font-sans">stripe</span>
              <span className="font-semibold tracking-tight text-xs font-mono">▲ vercel</span>
              <span className="font-semibold tracking-tight text-xs font-sans">supabase</span>
              <span className="font-semibold tracking-tight text-xs font-sans">linear</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Workflow Graph (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center z-10 w-full">
          
          <div className="w-full max-w-[580px] p-6 rounded-2xl border border-[#232328] bg-[#111114]/80 backdrop-blur-md relative overflow-hidden flex flex-col gap-6 select-none shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            
            {/* 1. Upload Source Node Card */}
            <motion.div
              animate={{
                borderColor: stage === "uploading" ? "#8b5cf6" : "#232328",
                boxShadow: stage === "uploading" ? "0 0 20px rgba(139,92,246,0.05)" : "none",
              }}
              className="p-3.5 rounded-xl border bg-black/40 flex items-center justify-between transition-all duration-500"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#cc0000]/10 flex items-center justify-center shrink-0 border border-[#cc0000]/20">
                  <Youtube className="w-5.5 h-5.5 text-[#ff0000]" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-zinc-200 font-sans">
                    keynote_address_2026.mp4
                  </h4>
                  <p className="text-[9.5px] text-zinc-500 font-mono">
                    YouTube URL &bull; 1.2 GB
                  </p>
                </div>
              </div>

              <div className="w-24 shrink-0 flex flex-col items-end gap-1 font-mono">
                {stage === "uploading" ? (
                  <>
                    <span className="text-[10px] text-violet-400 font-bold">{uploadProgress}%</span>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-violet-500"
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : stage === "idle" ? (
                  <span className="text-[9.5px] text-zinc-650 uppercase font-bold tracking-wider">
                    Waiting...
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9.5px] text-emerald-450 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>
            </motion.div>

            {/* Glowing Connector Line 1 */}
            <div className="relative h-6 w-full flex items-center justify-center">
              <div className="absolute top-0 bottom-0 w-[1px] bg-[#232328]" />
              {stage === "transcribing" && (
                <motion.div
                  className="absolute w-[2px] bg-blue-500"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ height: "12px" }}
                />
              )}
            </div>

            {/* 2. AI Context extraction pipeline card */}
            <motion.div
              animate={{
                borderColor: stage === "transcribing" || stage === "analyzing" ? "#3b82f6" : "#232328",
                boxShadow: stage === "transcribing" || stage === "analyzing" ? "0 0 20px rgba(59,130,246,0.05)" : "none",
              }}
              className="p-3.5 rounded-xl border bg-black/40 flex items-center justify-between transition-all duration-500"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Brain className="w-5.5 h-5.5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-zinc-200">
                    AI Cognitive Engine
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {stage === "transcribing" || stage === "analyzing" ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                        <span className="text-[9.5px] text-zinc-400 font-mono transition-all">
                          {aiTask}
                        </span>
                      </>
                    ) : stage === "generating" || stage === "scheduled" ? (
                      <span className="text-[9.5px] text-emerald-450 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Semantic context parsed (2,450 tokens)
                      </span>
                    ) : (
                      <span className="text-[9.5px] text-zinc-650 font-mono">
                        Pipeline idle
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sound wave visualizer during transcription */}
              {(stage === "transcribing" || stage === "analyzing") && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {[4, 12, 8, 16, 6, 10, 4].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 rounded-full bg-blue-500"
                      animate={{ height: [4, h, 4] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                      style={{ height: "4px" }}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Glowing Connector Line 2 (Branching paths) */}
            <div className="relative h-12 w-full flex items-center justify-center">
              <svg className="absolute w-full h-full text-[#232328]" viewBox="0 0 400 48" fill="none">
                <path d="M200 0V16M200 16C200 16 200 24 180 24H60C40 24 40 32 40 32V48M200 16V48M200 16C200 16 200 24 220 24H340C360 24 360 32 360 32V48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              
              {stage === "generating" && (
                <div className="absolute inset-0">
                  <svg className="w-full h-full text-blue-500" viewBox="0 0 400 48" fill="none">
                    <motion.path
                      d="M200 0V16M200 16C200 16 200 24 180 24H60C40 24 40 32 40 32V48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="40 100"
                      animate={{ strokeDashoffset: [140, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                    <motion.path
                      d="M200 16V48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="20 60"
                      animate={{ strokeDashoffset: [80, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    />
                    <motion.path
                      d="M200 16C200 16 200 24 220 24H340C360 24 360 32 360 32V48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="40 100"
                      animate={{ strokeDashoffset: [140, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* 3. Social Platform Output Cards */}
            <div className="grid grid-cols-3 gap-4">
              
              {/* Twitter Draft Node */}
              <motion.div
                animate={{
                  borderColor: stage === "generating" ? "#8b5cf6" : "#232328",
                  boxShadow: stage === "generating" ? "0 0 20px rgba(139,92,246,0.05)" : "none",
                }}
                className="p-3 rounded-xl border bg-black/40 flex flex-col gap-2 min-h-[140px] text-left transition-all duration-500"
              >
                <div className="flex items-center gap-1.5 border-b border-[#232328] pb-1.5">
                  <div className="w-5.5 h-5.5 rounded bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                    <TwitterIcon className="w-3 h-3 text-zinc-100" />
                  </div>
                  <span className="text-[9.5px] font-semibold text-zinc-200">Twitter/X</span>
                </div>
                
                <div className="text-[10px] leading-relaxed text-zinc-400 font-sans line-clamp-6 whitespace-pre-wrap">
                  {tweetDraft || <span className="text-zinc-700 italic">Waiting...</span>}
                </div>
              </motion.div>

              {/* LinkedIn Draft Node */}
              <motion.div
                animate={{
                  borderColor: stage === "generating" ? "#3b82f6" : "#232328",
                  boxShadow: stage === "generating" ? "0 0 20px rgba(59,130,246,0.05)" : "none",
                }}
                className="p-3 rounded-xl border bg-black/40 flex flex-col gap-2 min-h-[140px] text-left transition-all duration-500"
              >
                <div className="flex items-center gap-1.5 border-b border-[#232328] pb-1.5">
                  <div className="w-5.5 h-5.5 rounded bg-blue-600/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <LinkedinIcon className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-[9.5px] font-semibold text-zinc-200">LinkedIn</span>
                </div>
                
                <div className="text-[10px] leading-relaxed text-zinc-400 font-sans line-clamp-6 whitespace-pre-wrap">
                  {linkedinDraft || <span className="text-zinc-700 italic">Waiting...</span>}
                </div>
              </motion.div>

              {/* Instagram Draft Node */}
              <motion.div
                animate={{
                  borderColor: stage === "generating" ? "#ec4899" : "#232328",
                  boxShadow: stage === "generating" ? "0 0 20px rgba(236,72,153,0.05)" : "none",
                }}
                className="p-3 rounded-xl border bg-black/40 flex flex-col gap-2 min-h-[140px] text-left transition-all duration-500"
              >
                <div className="flex items-center gap-1.5 border-b border-[#232328] pb-1.5">
                  <div className="w-5.5 h-5.5 rounded bg-pink-600/10 flex items-center justify-center shrink-0 border border-pink-500/20">
                    <InstagramIcon className="w-3 h-3 text-pink-400" />
                  </div>
                  <span className="text-[9.5px] font-semibold text-zinc-200">Instagram</span>
                </div>
                
                <div className="text-[10px] leading-relaxed text-zinc-400 font-sans line-clamp-6 whitespace-pre-wrap">
                  {instagramDraft || <span className="text-zinc-700 italic">Waiting...</span>}
                </div>
              </motion.div>
            </div>

            {/* Glowing Connector Line 3 (Consolidating paths) */}
            <div className="relative h-12 w-full flex items-center justify-center">
              <svg className="absolute w-full h-full text-[#232328]" viewBox="0 0 400 48" fill="none">
                <path d="M40 0V16C40 16 40 24 60 24H180C200 24 200 32 200 32V48M360 0V16C360 16 360 24 340 24H220C200 24 200 32 200 32V48M200 0V48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              
              {stage === "scheduled" && (
                <div className="absolute inset-0">
                  <svg className="w-full h-full text-emerald-500" viewBox="0 0 400 48" fill="none">
                    <motion.path
                      d="M40 0V16C40 16 40 24 60 24H180C200 24 200 32 200 32V48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="40 100"
                      animate={{ strokeDashoffset: [140, 0] }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M200 0V48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="20 60"
                      animate={{ strokeDashoffset: [80, 0] }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M360 0V16C360 16 360 24 340 24H220C200 24 200 32 200 32V48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="40 100"
                      animate={{ strokeDashoffset: [140, 0] }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* 4. Scheduled Success Node Card */}
            <motion.div
              animate={{
                borderColor: stage === "scheduled" ? "#10b981" : "#232328",
                boxShadow: stage === "scheduled" ? "0 0 25px rgba(16,185,129,0.1)" : "none",
              }}
              className="p-3.5 rounded-xl border bg-black/40 flex items-center justify-between transition-all duration-500"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Calendar className="w-5.5 h-5.5 text-emerald-450" />
                </div>
                <div className="text-left">
                  <h4 className="text-[11.5px] font-semibold text-zinc-200">
                    Content Queue Publisher
                  </h4>
                  <p className="text-[9.5px] text-zinc-550 font-mono">
                    Automatic synchronization & scheduler
                  </p>
                </div>
              </div>

              <div className="shrink-0 font-mono">
                {stage === "scheduled" ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 text-[9.5px] text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
                  >
                    <Check className="w-3.5 h-3.5" /> Scheduled for Monday 9:00 AM
                  </motion.span>
                ) : (
                  <span className="text-[9.5px] text-zinc-650 uppercase font-bold tracking-wider">
                    Idle
                  </span>
                )}
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}
