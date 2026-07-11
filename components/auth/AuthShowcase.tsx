"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Calendar,
  RefreshCw,
  Check,
  Loader2,
  Lock,
  Globe,
  Sliders,
} from "lucide-react";

// Self-contained custom SVG icons
const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.002 3.002 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.002 3.002 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// Types for the simulation steps
type ShowcaseStep =
  | "idle" // 0
  | "typing_url" // 1
  | "clicking_analyze" // 2
  | "analyzing" // 3
  | "source_ready" // 4
  | "selecting_platforms" // 5
  | "switching_modes" // 6
  | "clicking_generate" // 7
  | "ai_typing" // 8
  | "cycling_tabs" // 9
  | "regenerating" // 10
  | "scheduling" // 11
  | "updating_analytics" // 12
  | "reset"; // 13

// Coordinate system for virtual mouse pointer (in percentage from top-left)
const CURSOR_COORDINATES: Record<ShowcaseStep, { x: string; y: string }> = {
  idle: { x: "40%", y: "45%" },
  typing_url: { x: "28%", y: "26%" },
  clicking_analyze: { x: "42%", y: "38%" },
  analyzing: { x: "42%", y: "38%" },
  source_ready: { x: "50%", y: "50%" },
  selecting_platforms: { x: "18%", y: "50%" }, // Over platform select
  switching_modes: { x: "25%", y: "65%" }, // Over tone select
  clicking_generate: { x: "28%", y: "82%" }, // Over Generate button
  ai_typing: { x: "70%", y: "40%" }, // Hovering over draft
  cycling_tabs: { x: "75%", y: "15%" }, // Hovering tab list
  regenerating: { x: "90%", y: "15%" }, // Over regenerate button
  scheduling: { x: "90%", y: "82%" }, // Over schedule button
  updating_analytics: { x: "50%", y: "90%" }, // Centered
  reset: { x: "40%", y: "45%" },
};

const DRAFT_TEXTS = {
  storytelling: {
    TWITTER: "1/ We spent 4 years building Recastr to turn video transcripts into social posts. \n\nHere is the exact framework we used to analyze 10,000+ hours of video and extract viral hooks...",
    LINKEDIN: "Last year, we set out to build an automation engine for video creators. \n\nWhat we discovered was surprising: \n- Bullet points don't drive engagement.\n- Direct value hooks perform 4x better.\n\nHere is the step-by-step breakdown of how we extract post-ready insights directly from video context.",
    INSTAGRAM: "🎬 The framework we used to turn 100+ videos into structured visual hooks. Tap the link to learn our step-by-step post outline!"
  },
  professional: {
    TWITTER: "1/ Video repurposing is an efficiency multiplier for B2B SaaS. \n\nBy leveraging transcript analyses, marketing departments can reduce production overhead by 68%. Here is the data...",
    LINKEDIN: "Content operations in 2026 require automation that respects context. \n\nWe analyzed B2B marketing channels and found that translating video recordings into high-quality textual assets increases lead acquisition by 2.4x. Here is the operational design...",
    INSTAGRAM: "📊 B2B Content operations framework: reduce overhead by 68% and amplify reach. Swipe for details."
  }
};

export function AuthShowcase() {
  const [currentStep, setCurrentStep] = useState<ShowcaseStep>("idle");
  const [urlInput, setUrlInput] = useState("");
  const [activePlatformTab, setActivePlatformTab] = useState<"TWITTER" | "LINKEDIN" | "INSTAGRAM">("TWITTER");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<"Storytelling" | "Professional">("Storytelling");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [typedContent, setTypedContent] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [analytics, setAnalytics] = useState({ credits: 48, scheduled: 12, views: "8.4k" });
  const [showCalendar, setShowCalendar] = useState(false);

  // YouTube typing sequence simulation
  const targetUrl = "youtube.com/watch?v=dQw4w9WgXcQ";

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;
    let isActive = true;
    
    const runWorkflow = async () => {
      if (!isActive) return;
      // 0. Idle / Start
      setCurrentStep("idle");
      setUrlInput("");
      setSelectedPlatforms([]);
      setSelectedTone("Storytelling");
      setIsAnalyzing(false);
      setIsGenerating(false);
      setTypedContent("");
      setIsScheduled(false);
      setScheduledDate("");
      setShowCalendar(false);
      
      await new Promise(r => setTimeout(r, 1000));
      if (!isActive) return;
      
      // 1. Typing YouTube URL
      setCurrentStep("typing_url");
      for (let i = 0; i <= targetUrl.length; i++) {
        await new Promise(r => setTimeout(r, 40));
        if (!isActive) return;
        setUrlInput(targetUrl.slice(0, i));
      }
      await new Promise(r => setTimeout(r, 400));
      if (!isActive) return;
      
      // 2. Click Analyze
      setCurrentStep("clicking_analyze");
      await new Promise(r => setTimeout(r, 800));
      if (!isActive) return;
      
      // 3. Analyzing State
      setCurrentStep("analyzing");
      setIsAnalyzing(true);
      await new Promise(r => setTimeout(r, 1800));
      if (!isActive) return;
      setIsAnalyzing(false);
      
      // 4. Source Ready
      setCurrentStep("source_ready");
      await new Promise(r => setTimeout(r, 1200));
      if (!isActive) return;
      
      // 5. Selecting Platforms
      setCurrentStep("selecting_platforms");
      await new Promise(r => setTimeout(r, 300));
      if (!isActive) return;
      setSelectedPlatforms(["TWITTER"]);
      await new Promise(r => setTimeout(r, 300));
      if (!isActive) return;
      setSelectedPlatforms(["TWITTER", "LINKEDIN"]);
      await new Promise(r => setTimeout(r, 300));
      if (!isActive) return;
      setSelectedPlatforms(["TWITTER", "LINKEDIN", "INSTAGRAM"]);
      await new Promise(r => setTimeout(r, 600));
      if (!isActive) return;

      // 6. Switching Modes / Tones
      setCurrentStep("switching_modes");
      await new Promise(r => setTimeout(r, 400));
      if (!isActive) return;
      setSelectedTone("Professional");
      await new Promise(r => setTimeout(r, 500));
      if (!isActive) return;
      setSelectedTone("Storytelling");
      await new Promise(r => setTimeout(r, 600));
      if (!isActive) return;
      
      // 7. Click Generate
      setCurrentStep("clicking_generate");
      await new Promise(r => setTimeout(r, 800));
      if (!isActive) return;
      
      // 8. AI Typing Content
      setCurrentStep("ai_typing");
      setIsGenerating(true);
      const textToType = DRAFT_TEXTS.storytelling.TWITTER;
      for (let i = 0; i <= textToType.length; i += 3) {
        await new Promise(r => setTimeout(r, 15));
        if (!isActive) return;
        setTypedContent(textToType.slice(0, i));
      }
      setIsGenerating(false);
      await new Promise(r => setTimeout(r, 800));
      if (!isActive) return;
      
      // 9. Cycling Tabs (Show LinkedIn/Instagram content)
      setCurrentStep("cycling_tabs");
      await new Promise(r => setTimeout(r, 300));
      if (!isActive) return;
      setActivePlatformTab("LINKEDIN");
      setTypedContent(DRAFT_TEXTS.storytelling.LINKEDIN);
      await new Promise(r => setTimeout(r, 1000));
      if (!isActive) return;
      setActivePlatformTab("INSTAGRAM");
      setTypedContent(DRAFT_TEXTS.storytelling.INSTAGRAM);
      await new Promise(r => setTimeout(r, 1000));
      if (!isActive) return;
      setActivePlatformTab("TWITTER");
      setTypedContent(DRAFT_TEXTS.storytelling.TWITTER);
      await new Promise(r => setTimeout(r, 600));
      if (!isActive) return;
      
      // 10. Regenerate in Professional mode
      setCurrentStep("regenerating");
      await new Promise(r => setTimeout(r, 700));
      if (!isActive) return;
      setSelectedTone("Professional");
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 600));
      if (!isActive) return;
      setIsGenerating(false);
      setTypedContent(DRAFT_TEXTS.professional.TWITTER);
      await new Promise(r => setTimeout(r, 1000));
      if (!isActive) return;
      
      // 11. Schedule Reminder
      setCurrentStep("scheduling");
      await new Promise(r => setTimeout(r, 400));
      if (!isActive) return;
      setShowCalendar(true);
      await new Promise(r => setTimeout(r, 800));
      if (!isActive) return;
      setScheduledDate("July 15");
      await new Promise(r => setTimeout(r, 500));
      if (!isActive) return;
      setShowCalendar(false);
      setIsScheduled(true);
      await new Promise(r => setTimeout(r, 600));
      if (!isActive) return;
      
      // 12. Update Analytics
      setCurrentStep("updating_analytics");
      setAnalytics(prev => ({
        credits: prev.credits - 1,
        scheduled: prev.scheduled + 1,
        views: "12.8k",
      }));
      await new Promise(r => setTimeout(r, 2000));
      if (!isActive) return;
      
      // 13. Reset Loop
      setCurrentStep("reset");
      await new Promise(r => setTimeout(r, 1000));
      if (!isActive) return;
      
      // Start over
      runWorkflow();
    };

    runWorkflow();

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative w-full h-[410px] rounded-2xl border border-[var(--app-line)] bg-black/40 backdrop-blur-md overflow-hidden select-none">
      {/* Top Browser Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--app-line)] bg-zinc-950/80">
        {/* Traffic Light Window Controls */}
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        
        {/* URL Box */}
        <div className="flex-1 max-w-[280px] mx-auto flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-500 font-mono">
          <Lock className="w-3 h-3 text-zinc-650" />
          <span className="text-zinc-400">recastr.app</span>/dashboard
        </div>

        <div className="w-12 shrink-0 flex justify-end">
          <span className="text-[10px] font-semibold font-mono text-violet-400/90 tracking-wide border border-violet-500/20 px-1.5 py-0.5 rounded bg-violet-500/10">
            {analytics.credits} cr
          </span>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="grid grid-cols-5 h-[calc(100%-39px)] text-zinc-300 font-sans text-xs">
        
        {/* LEFT COLUMN: Input/Settings Panel (40%) */}
        <div className="col-span-2 border-r border-[var(--app-line)] p-3 bg-zinc-950/30 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3.5">
            {/* Input URL Section */}
            <div>
              <label className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-550 mb-1">
                Source Document
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-2.5 text-red-550">
                  <Youtube className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={urlInput}
                  placeholder="Paste YouTube link..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 focus:outline-none placeholder-zinc-600"
                />
              </div>
            </div>

            {/* Analyze Trigger Button */}
            <motion.button
              animate={currentStep === "clicking_analyze" ? { scale: 0.95 } : { scale: 1 }}
              className="w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                  Analyzing...
                </>
              ) : currentStep === "source_ready" || currentStep === "selecting_platforms" || currentStep === "switching_modes" || currentStep === "clicking_generate" || currentStep === "ai_typing" || currentStep === "cycling_tabs" || currentStep === "regenerating" || currentStep === "scheduling" || currentStep === "updating_analytics" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-450" />
                  <span className="text-emerald-400">Source Ready</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-550" />
                  Analyze Source
                </>
              )}
            </motion.button>

            {/* Platforms Selection Section */}
            {(currentStep === "selecting_platforms" ||
              currentStep === "switching_modes" ||
              currentStep === "clicking_generate" ||
              currentStep === "ai_typing" ||
              currentStep === "cycling_tabs" ||
              currentStep === "regenerating" ||
              currentStep === "scheduling" ||
              currentStep === "updating_analytics") && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1.5"
              >
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-550">
                  Select Platforms
                </label>
                <div className="flex gap-2">
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-all ${
                      selectedPlatforms.includes("TWITTER")
                        ? "bg-zinc-100 text-black border-zinc-100"
                        : "bg-zinc-900/60 text-zinc-550 border-zinc-800"
                    }`}
                  >
                    <Twitter className="w-3 h-3" /> Twitter
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-all ${
                      selectedPlatforms.includes("LINKEDIN")
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-zinc-900/60 text-zinc-550 border-zinc-800"
                    }`}
                  >
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-all ${
                      selectedPlatforms.includes("INSTAGRAM")
                        ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                        : "bg-zinc-900/60 text-zinc-550 border-zinc-800"
                    }`}
                  >
                    <Instagram className="w-3 h-3" /> Instagram
                  </span>
                </div>
              </motion.div>
            )}

            {/* Tone Selector Section */}
            {(currentStep === "switching_modes" ||
              currentStep === "clicking_generate" ||
              currentStep === "ai_typing" ||
              currentStep === "cycling_tabs" ||
              currentStep === "regenerating" ||
              currentStep === "scheduling" ||
              currentStep === "updating_analytics") && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1.5"
              >
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-550">
                  Tone Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <span
                    className={`text-center py-1 rounded-md text-[10px] font-semibold transition-all ${
                      selectedTone === "Storytelling"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500"
                    }`}
                  >
                    Storytelling
                  </span>
                  <span
                    className={`text-center py-1 rounded-md text-[10px] font-semibold transition-all ${
                      selectedTone === "Professional"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500"
                    }`}
                  >
                    Professional
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Trigger Button at bottom */}
          <div>
            {(currentStep === "clicking_generate" ||
              currentStep === "ai_typing" ||
              currentStep === "cycling_tabs" ||
              currentStep === "regenerating" ||
              currentStep === "scheduling" ||
              currentStep === "updating_analytics") && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-2 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/10 border border-violet-500/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Drafts
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Output Previews / Draft Canvas (60%) */}
        <div className="col-span-3 p-3 bg-zinc-900/5 flex flex-col justify-between overflow-hidden relative">
          
          {/* Main Workspace Frame container */}
          <div className="flex-1 flex flex-col gap-2.5 h-[80%] overflow-hidden">
            {/* Conditional views depending on generation stage */}
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="analyzing-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-4"
                >
                  {/* Waveform Animation */}
                  <div className="flex items-center gap-1 mb-3">
                    {[0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0].map((val, idx) => (
                      <motion.div
                        key={idx}
                        className="w-0.5 rounded-full bg-violet-500"
                        animate={{ height: [8, val * 6 + 8, 8] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          delay: idx * 0.05,
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-semibold mb-1">
                    Analyzing Video Transcript
                  </div>
                  <div className="text-[9px] text-zinc-650 font-mono">
                    transcribing audio &bull; mapping entities &bull; extracting brief
                  </div>
                </motion.div>
              )}

              {/* Previews / Post Editor Container */}
              {(currentStep === "ai_typing" ||
                currentStep === "cycling_tabs" ||
                currentStep === "regenerating" ||
                currentStep === "scheduling" ||
                currentStep === "updating_analytics") && (
                <motion.div
                  key="editor-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Draft Tabs */}
                  <div className="flex items-center justify-between border-b border-[var(--app-line)] pb-1.5 mb-2.5">
                    <div className="flex gap-2">
                      <button
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          activePlatformTab === "TWITTER"
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-550"
                        }`}
                      >
                        Twitter
                      </button>
                      <button
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          activePlatformTab === "LINKEDIN"
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-555"
                        }`}
                      >
                        LinkedIn
                      </button>
                      <button
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          activePlatformTab === "INSTAGRAM"
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-555"
                        }`}
                      >
                        Instagram
                      </button>
                    </div>

                    {/* Regenerate Button */}
                    <button className="flex items-center gap-1 text-[9px] font-medium text-zinc-450 bg-zinc-805 px-1.5 py-0.5 rounded border border-zinc-750 hover:bg-zinc-700">
                      <RefreshCw className="w-2.5 h-2.5" />
                      Regen
                    </button>
                  </div>

                  {/* Render Platform Post Card mockups */}
                  <div className="flex-1 bg-zinc-950/60 border border-[var(--app-line)] rounded-xl p-3 flex flex-col justify-between overflow-y-auto max-h-[145px]">
                    <div>
                      {/* Platform header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                          {activePlatformTab === "TWITTER" && <Twitter className="w-3.5 h-3.5 text-zinc-200" />}
                          {activePlatformTab === "LINKEDIN" && <Linkedin className="w-3.5 h-3.5 text-blue-400" />}
                          {activePlatformTab === "INSTAGRAM" && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-zinc-200">
                            {activePlatformTab === "TWITTER" && "Recastr Studio"}
                            {activePlatformTab === "LINKEDIN" && "Recastr Operations"}
                            {activePlatformTab === "INSTAGRAM" && "recastr.io"}
                          </div>
                          <div className="text-[8px] text-zinc-550 font-mono">
                            {activePlatformTab === "TWITTER" && "@recastr_app"}
                            {activePlatformTab === "LINKEDIN" && "SaaS Platform"}
                            {activePlatformTab === "INSTAGRAM" && "Productivity Workspace"}
                          </div>
                        </div>
                      </div>

                      {/* Content Body with Typing simulation */}
                      <div className="text-[11px] leading-relaxed text-zinc-300 font-sans whitespace-pre-wrap">
                        {typedContent}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Placeholder when nothing is generated/loaded */}
              {(currentStep === "idle" || currentStep === "typing_url" || currentStep === "clicking_analyze" || currentStep === "source_ready" || currentStep === "selecting_platforms") && (
                <motion.div
                  key="placeholder-view"
                  className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800/80 rounded-xl p-4 text-center"
                >
                  <Globe className="w-6 h-6 text-zinc-750 mb-2" />
                  <div className="text-[10px] text-zinc-650 font-semibold mb-1">
                    Waiting for source document analysis
                  </div>
                  <div className="text-[9px] text-zinc-650">
                    Extract transcript to preview generated outputs across active social drafts.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Calendar popup modal */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-16 right-4 w-48 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl shadow-2xl z-20"
              >
                <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-550 mb-2">
                  Select Posting Time
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-zinc-400 mb-2 font-mono">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`py-1 rounded ${
                        idx === 9 ? "bg-violet-650 text-white font-bold" : "hover:bg-zinc-900"
                      }`}
                    >
                      {idx + 6}
                    </span>
                  ))}
                </div>
                <button className="w-full py-1 text-[9px] font-semibold text-white bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800">
                  Confirm July 15
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Action Footer: Scheduling Indicator & Mini Stats */}
          <div className="border-t border-[var(--app-line)] pt-2.5 mt-2 flex items-center justify-between">
            {/* Scheduling State display */}
            <div>
              {isScheduled ? (
                <span className="flex items-center gap-1 text-[9.5px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Scheduled for July 15
                </span>
              ) : (currentStep === "ai_typing" || currentStep === "cycling_tabs" || currentStep === "regenerating" || currentStep === "scheduling" || currentStep === "updating_analytics") ? (
                <button className="flex items-center gap-1.5 text-[9.5px] font-semibold text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 hover:bg-zinc-900">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Schedule Post
                </button>
              ) : (
                <div className="text-[9px] text-zinc-650 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Operations Canvas
                </div>
              )}
            </div>

            {/* Bottom Row Stats */}
            <div className="flex gap-4">
              <div className="text-right">
                <span className="block text-[8px] text-zinc-650 uppercase font-mono">Scheduled</span>
                <span className="text-[10px] font-bold text-zinc-300 font-mono">{analytics.scheduled}</span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-zinc-650 uppercase font-mono">Reach Proj</span>
                <span className="text-[10px] font-bold text-zinc-300 font-mono">{analytics.views}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Virtual Cursor pointer simulation */}
      <motion.div
        className="absolute w-5 h-5 z-50 pointer-events-none drop-shadow-md text-white/90"
        style={{ left: CURSOR_COORDINATES[currentStep].x, top: CURSOR_COORDINATES[currentStep].y }}
        transition={{ type: "spring", stiffness: 90, damping: 15 }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M4.5 3V17.5L9.2 12.8L14.5 21L17.5 19L12.2 10.8L17.5 9.2L4.5 3Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  );
}
