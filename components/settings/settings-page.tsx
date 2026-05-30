"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  Check,
  CreditCard,
  Link2,
  Mail,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { RazorpayButton } from "@/components/billing/RazorpayButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CurrentUser } from "@/lib/current-user";
import { PLAN_RULES } from "@/lib/plans";
import type { Plan } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "connected" | "billing" | "notifications";

const tabs: Array<{ value: SettingsTab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { value: "profile", label: "Profile", icon: UserCircle },
  { value: "connected", label: "Connected accounts", icon: Link2 },
  { value: "billing", label: "Workspace billing", icon: CreditCard },
  { value: "notifications", label: "Notifications", icon: Bell },
];

const platformCards = [
  { name: "Twitter / X", handle: "@recastr_ai", connected: true, lastSync: "2h ago" },
  { name: "LinkedIn", handle: "Recastr Studio", connected: true, lastSync: "4h ago" },
  { name: "Instagram", handle: "", connected: false, lastSync: "" },
  { name: "YouTube Shorts", handle: "", connected: false, lastSync: "" },
];

export function SettingsPage({ currentUser }: { currentUser?: CurrentUser | null }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<SettingsTab>(isSettingsTab(requestedTab) ? requestedTab : "profile");
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [plan, setPlan] = useState<Plan>(currentUser?.plan ?? "FREE");
  const [profile, setProfile] = useState({
    name: currentUser?.name ?? "Demo creator",
    email: currentUser?.email ?? "demo@recastr.app",
    creatorType: "Founder",
    defaultTone: "Casual",
  });
  const [notifications, setNotifications] = useState({
    ready: true,
    digest: true,
    reminder: false,
    marketing: false,
  });
  const usage = useMemo(() => {
    const limit = PLAN_RULES[plan].projectLimit;
    return {
      projects: limit === "unlimited" ? "7 / unlimited" : `2 / ${limit}`,
      content: "142 pieces",
      scheduled: "23 posts",
    };
  }, [plan]);

  useEffect(() => {
    setPlan(currentUser?.plan ?? "FREE");
    setProfile((current) => ({
      ...current,
      name: currentUser?.name ?? current.name,
      email: currentUser?.email ?? current.email,
    }));
  }, [currentUser?.email, currentUser?.name, currentUser?.plan]);

  useEffect(() => {
    if (isSettingsTab(requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage workspace preferences, connected accounts, billing, and notifications.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                activeTab === tab.value && "bg-[var(--violet)] text-white hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-[var(--violet)]" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--violet)] text-xl font-medium text-white">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <Button variant="secondary">Upload photo</Button>
                <p className="mt-1 text-xs text-muted-foreground">JPG or PNG, up to 2MB.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label="Email">
                <Input readOnly value={profile.email} />
              </Field>
              <Field label="Creator type">
                <select
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--violet)]"
                  value={profile.creatorType}
                  onChange={(event) => setProfile((current) => ({ ...current, creatorType: event.target.value }))}
                >
                  {["Founder", "Podcaster", "YouTuber", "Blogger", "Agency"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Default tone">
                <select
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--violet)]"
                  value={profile.defaultTone}
                  onChange={(event) => setProfile((current) => ({ ...current, defaultTone: event.target.value }))}
                >
                  {["Professional", "Casual", "Educational", "Entertaining"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Default platforms</p>
              <div className="flex flex-wrap gap-2">
                {["Twitter / X", "LinkedIn", "Instagram", "YouTube Shorts"].map((platform) => (
                  <Badge key={platform} className="bg-[var(--violet-light)] text-[var(--violet)] ring-[var(--violet)]/20">
                    <Check className="mr-1 h-3 w-3" />
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              onClick={() => toast.success("Profile updated")}
              className="bg-[var(--violet)] text-white hover:bg-[var(--violet-dark)]"
            >
              Save changes
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "connected" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {platformCards.map((account) => (
            <Card key={account.name}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", account.connected ? "bg-[var(--green-approve)]" : "bg-muted-foreground")} />
                      <h2 className="font-medium">{account.name}</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {account.connected ? `Connected as ${account.handle}` : "Not connected"}
                    </p>
                    {account.connected ? (
                      <p className="mt-1 text-xs text-muted-foreground">Last synced {account.lastSync}</p>
                    ) : null}
                  </div>
                  <Badge variant={account.connected ? "success" : "muted"}>
                    {account.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button variant={account.connected ? "secondary" : "default"}>
                    {account.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === "billing" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Current plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-muted/30 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <h2 className="mt-1 text-2xl font-medium">{PLAN_RULES[plan].label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Next billing: June 29, 2026</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="space-y-4">
                <UsageBar label="Projects created" value={usage.projects} percent={38} />
                <UsageBar label="Content generated" value={usage.content} percent={64} />
                <UsageBar label="Scheduled posts" value={usage.scheduled} percent={52} />
              </div>
              <div className="rounded-2xl border">
                <div className="grid grid-cols-3 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span>Month</span>
                  <span>Amount</span>
                  <span>Invoice</span>
                </div>
                {["May 2026", "Apr 2026"].map((month) => (
                  <div className="grid grid-cols-3 px-4 py-3 text-sm" key={month}>
                    <span>{month}</span>
                    <span>INR 999</span>
                    <button type="button" className="text-left text-[var(--violet)]">Download PDF</button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Upgrade</CardTitle>
                <div className="flex rounded-lg border bg-muted p-1">
                  {(["monthly", "annual"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setInterval(option)}
                      className={cn("h-8 rounded-md px-3 text-sm capitalize text-muted-foreground", interval === option && "bg-card text-foreground")}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(PLAN_RULES) as Plan[]).map((planName) => {
                const rule = PLAN_RULES[planName];
                const price = interval === "monthly" ? rule.monthlyPrice : rule.annualPrice;
                return (
                  <div className={cn("rounded-xl border p-4", plan === planName && "border-[var(--violet)]")} key={planName}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{rule.label}</h3>
                        <p className="mt-1 text-2xl font-medium">INR {price}</p>
                      </div>
                      {plan === planName ? <Badge variant="success">current</Badge> : null}
                    </div>
                    <div className="mt-3 space-y-2">
                      {rule.features.slice(0, 3).map((feature) => (
                        <p key={feature} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--violet)]" />
                          {feature}
                        </p>
                      ))}
                    </div>
                    {planName === "FREE" ? (
                      <Button className="mt-4 w-full" disabled={plan === "FREE"} variant="secondary">
                        {plan === "FREE" ? "Current plan" : "Choose free"}
                      </Button>
                    ) : (
                      <RazorpayButton
                        className="mt-4 w-full"
                        interval={interval}
                        label={plan === planName ? "Manage plan" : `Choose ${rule.label}`}
                        onSuccess={() => setPlan(planName)}
                        plan={planName}
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "notifications" ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--violet)]" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {[
              ["ready", "Email when content is ready", "Send an email after an analysis or generation job finishes."],
              ["digest", "Weekly digest email", "Summarize usage, exports, and scheduled content every week."],
              ["reminder", "Schedule reminder", "Remind me before a scheduled post goes out."],
              ["marketing", "Marketing emails", "Occasional product updates and growth playbooks."],
            ].map(([key, label, helper]) => (
              <div className="flex items-center justify-between gap-4 py-4" key={key}>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                </div>
                <button
                  aria-label={label}
                  type="button"
                  onClick={() => {
                    setNotifications((current) => ({ ...current, [key]: !current[key as keyof typeof current] }));
                    toast.success("Notification preference updated");
                  }}
                  className={cn(
                    "relative h-6 w-11 rounded-full border transition",
                    notifications[key as keyof typeof notifications] ? "bg-[var(--violet)]" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
                      notifications[key as keyof typeof notifications] ? "left-5" : "left-0.5",
                    )}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function UsageBar({ label, percent, value }: { label: string; percent: number; value: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-[var(--violet)]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function isSettingsTab(value: string | null): value is SettingsTab {
  return value === "profile" || value === "connected" || value === "billing" || value === "notifications";
}
