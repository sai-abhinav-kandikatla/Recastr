"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  RefreshCw,
  Check,
  Loader2,
  Lock,
  Globe,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Copy
} from "lucide-react";

// Strict monochrome style icons
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

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const ThreadsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 24c-6.627 0-12-5.373-12-12s5.373-12 12-12 12 5.373 12 12-5.373 12-12 12zm0-22c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 15c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5zm0-8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.002 3.002 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.002 3.002 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

type DemoStep =
  | "idle"                     // Scene 1: Empty state
  | "typing_url"               // Scene 1: Inputting YouTube link
  | "clicking_analyze"         // Scene 1: Clicks Analyze Source
  | "analyzing"                // Scene 1: Waveform / Loading
  | "source_ready"             // Scene 2: Meta data loaded
  | "selecting_platforms"      // Scene 3: Highlight socials one by one
  | "cycling_rewrite_modes"    // Scene 4: Cycle tones & show corresponding text
  | "clicking_generate"        // Scene 5: Clicks Generate button
  | "generating"               // Scene 5: Real loading shimmer
  | "content_ready"            // Scene 5: Twitter post animates into view
  | "workspace_scroll"         // Scene 6: Switch view to Workspace / editor
  | "workspace_edit"           // Scene 6: Edits text, cursor blink
  | "clicking_copy"            // Scene 6: Click copy, toast appears
  | "clicking_regenerate"      // Scene 7: Click Regen
  | "regenerating"             // Scene 7: Content morphs to alternative version
  | "scheduling_open"          // Scene 8: Open Calendar popover
  | "scheduling_select"        // Scene 8: Select date on calendar
  | "scheduling_confirm"       // Scene 8: Click Save, shows confirmation animation
  | "analytics_open"           // Scene 9: Open Analytics view, charts rise
  | "loop_reset";              // Scene 10: Smooth fade out and restart

// Coordinate map for virtual cursor (x, y in % relative to showcase container)
const CURSOR_POSITIONS: Record<DemoStep, { x: string; y: string }> = {
  idle: { x: "40%", y: "45%" },
  typing_url: { x: "28%", y: "26%" },
  clicking_analyze: { x: "32%", y: "37%" },
  analyzing: { x: "50%", y: "50%" },
  source_ready: { x: "50%", y: "50%" },
  selecting_platforms: { x: "22%", y: "52%" },
  cycling_rewrite_modes: { x: "24%", y: "74%" },
  clicking_generate: { x: "20%", y: "88%" },
  generating: { x: "50%", y: "50%" },
  content_ready: { x: "70%", y: "15%" },
  workspace_scroll: { x: "90%", y: "15%" },
  workspace_edit: { x: "65%", y: "40%" },
  clicking_copy: { x: "82%", y: "83%" },
  clicking_regenerate: { x: "90%", y: "15%" },
  regenerating: { x: "50%", y: "50%" },
  scheduling_open: { x: "62%", y: "83%" },
  scheduling_select: { x: "78%", y: "55%" },
  scheduling_confirm: { x: "82%", y: "68%" },
  analytics_open: { x: "90%", y: "88%" },
  loop_reset: { x: "40%", y: "45%" }
};

const SAMPLE_TEXTS = {
  Storytelling: {
    TWITTER: "1/ We spent 4 years building Recastr to turn raw transcripts into structured posts.\n\nHere is the exact framework we used to analyze 10,000+ hours of video and extract viral hooks...",
    LINKEDIN: "Last year, we set out to build an automation engine for video creators.\n\nWhat we discovered was surprising:\n- Paragraph blocks don't drive engagement.\n- Direct value hooks perform 4x better.\n\nHere is the step-by-step breakdown of how we extract post-ready insights directly from video context.",
    INSTAGRAM: "🎬 The framework we used to turn 100+ videos into structured visual hooks. Tap the link to learn our step-by-step post outline!",
    FACEBOOK: "Video repurposing is broken. Standard transcript dumps get ignored. We mapped the exact patterns behind 10k hours of high-performing video clips. Here's our playbook."
  },
  Professional: {
    TWITTER: "1/ Video repurposing is an efficiency multiplier for B2B SaaS.\n\nBy leveraging transcript analyses, marketing departments can reduce production overhead by 68%. Here is the data...",
    LINKEDIN: "Content operations in 2026 require automation that respects context.\n\nWe analyzed B2B marketing channels and found that translating video recordings into high-quality textual assets increases lead acquisition by 2.4x. Here is the operational design...",
    INSTAGRAM: "📊 B2B Content operations framework: reduce overhead by 68% and amplify reach. Swipe for details.",
    FACEBOOK: "SaaS teams: raw audio transcripts don't convert. Optimize your production pipeline by formatting video transcripts into platform-optimized text posts."
  },
  Viral: {
    TWITTER: "this 1 simple video repurposing framework will save you 20+ hours a week. guaranteed. 🧵",
    LINKEDIN: "Most creators are doing video repurposing completely wrong. They copy transcripts. Don't do that. Do this instead.",
    INSTAGRAM: "The secret to viral video captions. Swipe to unlock the formula! 🚀",
    FACEBOOK: "The ultimate cheat sheet for video content creators. Get more views now."
  }
};

export function AuthShowcase() {
  const [currentStep, setCurrentStep] = useState<DemoStep>("idle");
  const [urlInput, setUrlInput] = useState("");
  const [activePlatformTab, setActivePlatformTab] = useState<"TWITTER" | "LINKEDIN" | "INSTAGRAM" | "FACEBOOK">("TWITTER");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<"Storytelling" | "Professional" | "Viral">("Storytelling");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [typedContent, setTypedContent] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentView, setCurrentView] = useState<"generator" | "workspace" | "analytics">("generator");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [analyticsStats, setAnalyticsStats] = useState({ posts: 156, scheduled: 12, views: "8.4k", credits: 48 });
  
  // Performance states
  const [isTabActive, setIsTabActive] = useState(true);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Tab visibility observer
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Intersection observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Loop simulation workflow
  useEffect(() => {
    if (shouldReduceMotion) {
      // Freeze at completed state
      setCurrentStep("content_ready");
      setUrlInput("youtube.com/watch?v=dQw4w9WgXcQ");
      setSelectedPlatforms(["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK"]);
      setSelectedTone("Storytelling");
      setTypedContent(SAMPLE_TEXTS.Storytelling.TWITTER);
      setCurrentView("generator");
      return;
    }

    let isActive = true;
    const targetUrl = "youtube.com/watch?v=dQw4w9WgXcQ";

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      while (isActive) {
        if (!isTabActive || !isIntersecting) {
          await wait(1000);
          continue;
        }

        // Scene 1: Idle
        setCurrentView("generator");
        setCurrentStep("idle");
        setUrlInput("");
        setSelectedPlatforms([]);
        setSelectedTone("Storytelling");
        setIsAnalyzing(false);
        setIsGenerating(false);
        setTypedContent("");
        setIsScheduled(false);
        setShowCalendar(false);
        setToastMessage(null);
        setAnalyticsStats({ posts: 156, scheduled: 12, views: "8.4k", credits: 48 });
        await wait(1000);

        // Scene 1: Typing URL
        setCurrentStep("typing_url");
        for (let i = 1; i <= targetUrl.length; i++) {
          if (!isActive || !isTabActive || !isIntersecting) break;
          setUrlInput(targetUrl.substring(0, i));
          await wait(45);
        }
        await wait(400);

        // Scene 1: Click Analyze Source
        setCurrentStep("clicking_analyze");
        await wait(600);

        // Scene 1: Analyzing Audio
        setCurrentStep("analyzing");
        setIsAnalyzing(true);
        await wait(1800);
        setIsAnalyzing(false);

        // Scene 2: Source Ready
        setCurrentStep("source_ready");
        await wait(1000);

        // Scene 3: Selecting Platforms one by one
        setCurrentStep("selecting_platforms");
        await wait(300);
        setSelectedPlatforms(["TWITTER"]);
        await wait(300);
        setSelectedPlatforms(["TWITTER", "LINKEDIN"]);
        await wait(300);
        setSelectedPlatforms(["TWITTER", "LINKEDIN", "INSTAGRAM"]);
        await wait(300);
        setSelectedPlatforms(["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK"]);
        await wait(800);

        // Scene 4: Rewrite Mode Tone Cycling
        setCurrentStep("cycling_rewrite_modes");
        setSelectedTone("Professional");
        await wait(700);
        setSelectedTone("Viral");
        await wait(700);
        setSelectedTone("Storytelling");
        await wait(800);

        // Scene 5: Clicks Generate Content
        setCurrentStep("clicking_generate");
        await wait(600);

        // Scene 5: Loading Shimmer
        setCurrentStep("generating");
        setIsGenerating(true);
        await wait(1500);
        setIsGenerating(false);

        // Scene 5: Twitter preview loaded, AI types content
        setCurrentStep("content_ready");
        setActivePlatformTab("TWITTER");
        const fullContent = SAMPLE_TEXTS.Storytelling.TWITTER;
        for (let i = 1; i <= fullContent.length; i += 3) {
          if (!isActive || !isTabActive || !isIntersecting) break;
          setTypedContent(fullContent.substring(0, i));
          await wait(15);
        }
        await wait(1000);

        // Tab Cycling: LinkedIn
        setActivePlatformTab("LINKEDIN");
        setTypedContent(SAMPLE_TEXTS.Storytelling.LINKEDIN);
        await wait(1200);

        // Tab Cycling: Instagram
        setActivePlatformTab("INSTAGRAM");
        setTypedContent(SAMPLE_TEXTS.Storytelling.INSTAGRAM);
        await wait(1200);

        // Tab Cycling: Back to Twitter
        setActivePlatformTab("TWITTER");
        setTypedContent(SAMPLE_TEXTS.Storytelling.TWITTER);
        await wait(600);

        // Scene 6: Open Workspace
        setCurrentStep("workspace_scroll");
        await wait(600);
        setCurrentView("workspace");
        await wait(600);

        // Scene 6: Cursor edits text
        setCurrentStep("workspace_edit");
        await wait(800);
        const originalText = SAMPLE_TEXTS.Storytelling.TWITTER;
        const editedText = originalText.replace("extract viral hooks...", "craft viral hooks directly from transcripts.");
        setTypedContent(editedText);
        await wait(1000);

        // Scene 6: Click Copy and Toast appears
        setCurrentStep("clicking_copy");
        await wait(400);
        setToastMessage("Copied to clipboard ✓");
        await wait(1200);
        setToastMessage(null);

        // Scene 7: Click Regenerate
        setCurrentStep("clicking_regenerate");
        await wait(600);
        setCurrentStep("regenerating");
        setIsGenerating(true);
        await wait(1000);
        setIsGenerating(false);
        setSelectedTone("Professional");
        setTypedContent(SAMPLE_TEXTS.Professional.TWITTER);
        await wait(1200);

        // Scene 8: Open Schedule Reminder (Back to generator view)
        setCurrentView("generator");
        await wait(400);
        setCurrentStep("scheduling_open");
        await wait(500);
        setShowCalendar(true);
        await wait(600);

        // Scene 8: Choose date on calendar popup
        setCurrentStep("scheduling_select");
        await wait(800);

        // Scene 8: Save reminder and confirm
        setCurrentStep("scheduling_confirm");
        await wait(600);
        setShowCalendar(false);
        setIsScheduled(true);
        setToastMessage("Reminder scheduled successfully!");
        setAnalyticsStats((prev) => ({ ...prev, scheduled: 13 }));
        await wait(1500);
        setToastMessage(null);

        // Scene 9: Open Analytics & update stats
        setCurrentStep("analytics_open");
        await wait(500);
        setCurrentView("analytics");
        await wait(800);
        // Stats increment animation
        setAnalyticsStats({
          posts: 157,
          scheduled: 13,
          views: "12.8k",
          credits: 47
        });
        await wait(2200);

        // Scene 10: Seamless reset
        setCurrentStep("loop_reset");
        await wait(800);
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, [shouldReduceMotion, isTabActive, isIntersecting]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none filter grayscale contrast-[1.03] brightness-[1.02]"
      role="img"
      aria-label="Animated demonstration of Recastr content generation workflow"
    >
      {/* Background Soft Bloom Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Showcase Container Window */}
      <div className="relative w-full h-[420px] rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_50px_rgba(255,255,255,0.05)] will-change-transform">
        
        {/* Browser Chrome Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
          {/* Traffic Lights */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          </div>

          {/* URL Box */}
          <div className="flex-1 max-w-[280px] mx-auto flex items-center justify-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-white/[0.06] text-[10px] text-zinc-550 font-mono">
            <Lock className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-400">recastr.app</span>
            <span>/</span>
            <span className="text-zinc-500">{currentView}</span>
          </div>

          {/* Right Header Controls */}
          <div className="w-12 flex justify-end shrink-0">
            <span className="text-[10px] font-semibold font-mono text-white/80 border border-white/10 px-1.5 py-0.5 rounded bg-white/5">
              {analyticsStats.credits} cr
            </span>
          </div>
        </div>

        {/* View Layouts */}
        <div className="h-[calc(100%-39px)] text-zinc-300 font-sans text-xs">
          <AnimatePresence mode="wait">
            
            {/* View 1: Generator Canvas */}
            {currentView === "generator" && (
              <motion.div
                key="generator-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-5 h-full"
              >
                {/* Left Side: Parameters / Settings */}
                <div className="col-span-2 border-r border-white/10 p-3 bg-zinc-950/20 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-3">
                    
                    {/* YouTube input source */}
                    <div>
                      <label className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                        Source Document
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-2.5 text-zinc-500">
                          <YoutubeIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={urlInput}
                          placeholder="Paste YouTube link..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-[10px] text-zinc-300 focus:outline-none placeholder-zinc-700"
                        />
                      </div>
                    </div>

                    {/* Analyze Source Action button */}
                    <button
                      className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                        isAnalyzing
                          ? "border-white/20 bg-zinc-900 text-zinc-400"
                          : urlInput
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-zinc-950 text-zinc-500"
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Analyzing Source...
                        </>
                      ) : urlInput ? (
                        <>
                          <Check className="w-3 h-3" />
                          Source Ready
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-zinc-650" />
                          Analyze Source
                        </>
                      )}
                    </button>

                    {/* Platform Selector (Fades in when url present) */}
                    {(urlInput || selectedPlatforms.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5"
                      >
                        <label className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                          Platforms
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: "TWITTER", label: "Twitter", icon: TwitterIcon },
                            { id: "LINKEDIN", label: "LinkedIn", icon: LinkedinIcon },
                            { id: "INSTAGRAM", label: "Insta", icon: InstagramIcon },
                            { id: "FACEBOOK", label: "FB", icon: FacebookIcon }
                          ].map((platform) => {
                            const isSel = selectedPlatforms.includes(platform.id);
                            const Icon = platform.icon;
                            return (
                              <span
                                key={platform.id}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium transition-all ${
                                  isSel
                                    ? "bg-white text-black border-white"
                                    : "bg-zinc-950 text-zinc-500 border-white/5"
                                }`}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                {platform.label}
                              </span>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Tone Options selector */}
                    {selectedPlatforms.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5"
                      >
                        <label className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                          Tone Mode
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-0.5 rounded-lg border border-white/5">
                          {["Storytelling", "Professional", "Viral"].map((t) => {
                            const isSel = selectedTone === t;
                            return (
                              <span
                                key={t}
                                className={`text-center py-1 rounded text-[9px] font-medium transition-all ${
                                  isSel
                                    ? "bg-zinc-900 text-white font-semibold shadow"
                                    : "text-zinc-600"
                                }`}
                              >
                                {t}
                              </span>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* Generate Button at bottom */}
                  <div>
                    {selectedPlatforms.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full py-2 rounded-lg text-[10px] font-semibold text-black bg-white hover:bg-zinc-200 flex items-center justify-center gap-1.5 transition-all"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Content
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Right Side: Output Canvas Preview */}
                <div className="col-span-3 p-3 bg-zinc-900/5 flex flex-col justify-between overflow-hidden relative">
                  <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
                    
                    {/* Placeholder Empty Canvas */}
                    {!isGenerating && !typedContent && (
                      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-4 text-center">
                        <Globe className="w-5 h-5 text-zinc-700 mb-2" />
                        <span className="text-[10px] text-zinc-500 font-semibold mb-0.5">
                          Waiting for Source Analysis
                        </span>
                        <span className="text-[8px] text-zinc-650 max-w-[180px] leading-normal">
                          Analyze content to preview formatted social outputs
                        </span>
                      </div>
                    )}

                    {/* Waveform Analyze Wave overlay */}
                    {isAnalyzing && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <div className="flex items-center gap-1 mb-2">
                          {[0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1].map((val, idx) => (
                            <motion.div
                              key={idx}
                              className="w-0.5 rounded-full bg-white"
                              animate={{ height: [8, val * 5 + 8, 8] }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.1,
                                delay: idx * 0.04
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-semibold">
                          Extracting Transcript Brief
                        </span>
                      </div>
                    )}

                    {/* Real Shimmer Output Generation */}
                    {isGenerating && (
                      <div className="flex-1 flex flex-col gap-3 p-3 border border-white/5 bg-zinc-950/40 rounded-xl animate-pulse">
                        <div className="h-4 w-3/4 rounded bg-zinc-800" />
                        <div className="space-y-2">
                          <div className="h-3 w-full rounded bg-zinc-800" />
                          <div className="h-3 w-5/6 rounded bg-zinc-800" />
                          <div className="h-3 w-full rounded bg-zinc-800" />
                        </div>
                      </div>
                    )}

                    {/* Previews / Post Editor Container */}
                    {!isAnalyzing && !isGenerating && typedContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col overflow-hidden"
                      >
                        {/* Preview platform tabs */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                          <div className="flex gap-1.5">
                            {["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK"].map((tab) => (
                              <span
                                key={tab}
                                className={`px-2 py-0.5 rounded text-[8px] font-semibold transition-all ${
                                  activePlatformTab === tab
                                    ? "bg-white text-black"
                                    : "text-zinc-650"
                                }`}
                              >
                                {tab}
                              </span>
                            ))}
                          </div>
                          
                          <span className="flex items-center gap-1 text-[8px] text-zinc-500">
                            <RefreshCw className="w-2 h-2" /> Regen
                          </span>
                        </div>

                        {/* Rendering simulated Post Card */}
                        <div className="flex-1 bg-zinc-950/60 border border-white/10 rounded-xl p-3 flex flex-col justify-between overflow-y-auto max-h-[145px]">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                                {activePlatformTab === "TWITTER" && <TwitterIcon className="w-3 h-3 text-white" />}
                                {activePlatformTab === "LINKEDIN" && <LinkedinIcon className="w-3 h-3 text-white" />}
                                {activePlatformTab === "INSTAGRAM" && <InstagramIcon className="w-3 h-3 text-white" />}
                                {activePlatformTab === "FACEBOOK" && <FacebookIcon className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <div className="text-[9px] font-semibold text-white leading-none">Recastr Studio</div>
                                <div className="text-[7px] text-zinc-600 font-mono">@recastr_app</div>
                              </div>
                            </div>

                            <p className="text-[10px] leading-relaxed text-zinc-300 font-sans whitespace-pre-wrap">
                              {typedContent}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* Actions / Stats bar */}
                  <div className="border-t border-white/10 pt-2 flex items-center justify-between shrink-0">
                    <div>
                      {typedContent ? (
                        <button className="flex items-center gap-1 text-[9px] font-semibold text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-white/5">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          Schedule Post
                        </button>
                      ) : (
                        <span className="text-[8px] text-zinc-700 font-semibold uppercase tracking-wider">
                          Canvas Space
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="text-right">
                        <span className="block text-[7px] text-zinc-600 uppercase font-mono">Scheduled</span>
                        <span className="text-[9px] font-bold text-zinc-400 font-mono">
                          {analyticsStats.scheduled}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[7px] text-zinc-600 uppercase font-mono">Reach Proj</span>
                        <span className="text-[9px] font-bold text-zinc-400 font-mono">
                          {analyticsStats.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View 2: Workspace Editor */}
            {currentView === "workspace" && (
              <motion.div
                key="workspace-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 flex flex-col h-full bg-zinc-950/20"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-600">← Back</span>
                    <span className="text-zinc-700">/</span>
                    <span className="text-[9px] text-white font-medium">Workspace Editor</span>
                  </div>

                  <div className="flex gap-1.5">
                    {["X / Twitter", "LinkedIn", "Instagram"].map((tab, idx) => (
                      <span
                        key={tab}
                        className={`px-2 py-0.5 rounded text-[8px] font-semibold ${
                          idx === 0 ? "bg-white text-black font-bold" : "text-zinc-600"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-1 bg-zinc-950/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                        <TwitterIcon className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-[9px] font-semibold text-white">Recastr Studio</div>
                        <div className="text-[7px] text-zinc-600 font-mono">@recastr_app</div>
                      </div>
                    </div>

                    <div className="text-[10px] leading-relaxed text-zinc-300 font-sans border-l-2 border-white/20 pl-2 py-0.5">
                      {typedContent}
                      <span className="inline-block w-1.5 h-3.5 bg-white/70 animate-pulse ml-0.5" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                    <button className="flex items-center gap-1.5 text-[9px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-white/10">
                      <Copy className="w-3 h-3" />
                      Copy text
                    </button>
                    <button className="flex items-center gap-1.5 text-[9px] font-semibold text-black bg-white px-2.5 py-1 rounded font-bold">
                      Save Draft
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View 3: Analytics dashboard */}
            {currentView === "analytics" && (
              <motion.div
                key="analytics-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-white">Analytics Performance</span>
                    <span className="text-[8px] text-zinc-600 uppercase tracking-widest font-mono">14 days</span>
                  </div>

                  {/* Grid stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Posts Generated", val: analyticsStats.posts, change: "+14%" },
                      { label: "Scheduled Posts", val: analyticsStats.scheduled, change: "+8%" },
                      { label: "Reach Proj", val: analyticsStats.views, change: "+24%" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-zinc-950/60 border border-white/10 rounded-lg p-2 flex flex-col justify-between">
                        <span className="text-[8px] text-zinc-600">{stat.label}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xs font-bold text-white font-mono">{stat.val}</span>
                          <span className="text-[8px] text-zinc-500 font-mono">{stat.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Simple chart design */}
                  <div className="bg-zinc-950/40 border border-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] text-zinc-600">Daily Engagement Trend</span>
                      <span className="flex items-center gap-0.5 text-[8px] text-white">
                        <TrendingUp className="w-2.5 h-2.5" /> High
                      </span>
                    </div>

                    {/* Custom SVG spark bars */}
                    <div className="h-14 flex items-end gap-1.5 pt-2">
                      {[15, 30, 20, 45, 60, 40, 50, 75, 60, 85, 90, 110, 95, 120].map((height, i) => (
                        <div key={i} className="flex-1 bg-zinc-900 rounded-t overflow-hidden h-full flex flex-col justify-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.6, delay: i * 0.03 }}
                            className="w-full bg-white/20 hover:bg-white/40"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="text-[8px] text-zinc-700 font-semibold font-mono">
                    Updated live &bull; Recastr Engine
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Floating Calendar Popup popover */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute bottom-16 right-4 w-44 bg-black border border-white/10 p-2 rounded-xl shadow-2xl z-20"
            >
              <div className="flex items-center justify-between mb-1.5 border-b border-white/5 pb-1">
                <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                  July 2026
                </span>
                <div className="flex gap-1">
                  <ChevronLeft className="w-2.5 h-2.5 text-zinc-750" />
                  <ChevronRight className="w-2.5 h-2.5 text-zinc-750" />
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-[7px] text-zinc-600 mb-1 font-mono">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-mono">
                {Array.from({ length: 14 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`py-0.5 rounded transition-all ${
                      idx === 9
                        ? "bg-white text-black font-extrabold"
                        : "text-zinc-450 hover:bg-zinc-900"
                    }`}
                  >
                    {idx + 6}
                  </span>
                ))}
              </div>

              <button className="w-full mt-2 py-1 text-[8px] font-bold text-black bg-white rounded">
                Confirm Date
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative subtle Edge Glow borders */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

        {/* Toast notifications */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full border border-white/20 bg-zinc-950/90 text-[9px] text-white font-medium flex items-center gap-1.5 shadow-2xl z-30 backdrop-blur-md"
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Virtual Cursor Pointer pointer */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute w-4 h-4 z-50 pointer-events-none drop-shadow-md text-white"
            style={{
              left: CURSOR_POSITIONS[currentStep].x,
              top: CURSOR_POSITIONS[currentStep].y
            }}
            transition={{
              type: "spring",
              stiffness: 85,
              damping: 14,
              mass: 0.8
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
              <path
                d="M4.5 3v14.5l4.7-4.7 5.3 8.2 3-2-5.3-8.2 5.3-1.6L4.5 3z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}

      </div>
    </div>
  );
}
