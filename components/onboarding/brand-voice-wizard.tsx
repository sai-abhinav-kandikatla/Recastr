"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, FileUp, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressJob } from "@/components/ui/progress-job";
import { Textarea } from "@/components/ui/textarea";
import { readApiJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const creatorTypes = ["Podcaster", "YouTuber", "Blogger", "Coach", "Brand", "Agency"];
const platforms = ["Twitter", "LinkedIn", "Instagram", "YouTube Shorts"];
const tones = [
  ["Professional", "Polished, specific, credible."],
  ["Casual", "Human, direct, easy to read."],
  ["Educational", "Useful, structured, tactical."],
  ["Entertaining", "Sharp, visual, high-energy."],
];

export function BrandVoiceWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [creatorType, setCreatorType] = useState("Podcaster");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Twitter", "LinkedIn"]);
  const [tone, setTone] = useState("Casual");
  const [source, setSource] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  async function complete() {
    toast.success("Workspace profile saved");
    if (source.trim()) {
      const response = await fetch("/api/ingest/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${creatorType} source`,
          text: source,
        }),
      });
      let data: { projectId?: string };
      try {
        data = await readApiJson(response);
      } catch (error) {
        if (error instanceof Error && error.message === "credit_exhausted") return;
        toast.error(error instanceof Error ? error.message : "Could not analyze source");
        return;
      }
      if (data.projectId) {
        router.push(`/projects/${data.projectId}`);
        return;
      }
    }
    setJobId(`demo-job-${Date.now()}`);
    router.push("/projects/demo-founder-podcast");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-[28px] border bg-card/80 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-normal">Set up your creator workflow</h1>
            <p className="mt-1 text-sm text-muted-foreground">Four quick choices tune Recastr for your first pack.</p>
          </div>
          <span className="text-sm text-muted-foreground">{step + 1}/4</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            {[
              "What kind of creator are you?",
              "Which platforms do you post on?",
              "What tone fits your brand?",
              "Paste your first source",
            ][step]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {creatorTypes.map((item) => (
                <ChoiceCard key={item} active={creatorType === item} label={item} onClick={() => setCreatorType(item)} />
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-wrap gap-3">
              {platforms.map((item) => {
                const active = selectedPlatforms.includes(item);
                return (
                  <button
                    key={item}
                    className={cn("rounded-full border px-4 py-2 text-sm", active && "border-primary bg-primary/10 text-primary")}
                    onClick={() =>
                      setSelectedPlatforms((current) =>
                        active ? current.filter((platform) => platform !== item) : [...current, item],
                      )
                    }
                    type="button"
                  >
                    {active ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}
                    {item}
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {tones.map(([name, sample]) => (
                <button
                  key={name}
                  className={cn("rounded-[16px] border p-4 text-left", tone === name && "border-primary bg-primary/10")}
                  onClick={() => setTone(name)}
                  type="button"
                >
                  <p className="font-medium">{name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{sample}</p>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <Input placeholder="Paste a YouTube/blog URL" />
                <Textarea
                  className="min-h-44"
                  placeholder="Or paste raw text/transcript here"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                />
              </div>
              <div className="rounded-[16px] border border-dashed p-5 text-sm text-muted-foreground">
                <FileUp className="mb-3 h-5 w-5 text-primary" />
                Drop audio or transcript files here in the full upload flow.
                <div className="mt-4 flex items-center gap-2 text-primary">
                  <Link2 className="h-4 w-4" />
                  Demo mode is instant
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-between border-t pt-4">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((current) => current + 1)}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={complete}>
                Generate first project
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {jobId ? <ProgressJob jobId={jobId} /> : null}
    </div>
  );
}

function ChoiceCard({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={cn("rounded-[16px] border p-5 text-left transition hover:border-primary", active && "border-primary bg-primary/10")}
      onClick={onClick}
      type="button"
    >
      <p className="font-medium">{label}</p>
      <p className="mt-2 text-sm text-muted-foreground">Optimize hooks and output style for this workflow.</p>
    </button>
  );
}
