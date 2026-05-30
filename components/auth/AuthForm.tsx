"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const authSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters").optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type AuthValues = z.infer<typeof authSchema>;

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = mode === "signup";
  const nextPath = normalizeNextPath(searchParams.get("next"), isSignup ? "/onboarding" : "/dashboard");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: AuthValues) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      continueLocally("Demo auth enabled");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (isSignup) {
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const signupPayload = (await signupResponse.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!signupResponse.ok && signupPayload.code !== "signup_admin_unavailable") {
        toast.error(signupPayload.error ?? "Could not create account");
        return;
      }

      if (signupPayload.code === "signup_admin_unavailable") {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              name: values.name || values.email.split("@")[0],
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (!data.session) {
          toast.success("Account created. Check your email to confirm access.");
          return;
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        toast.error(signInError.message);
        return;
      }

      toast.success("Welcome to Recastr");
      router.replace(nextPath);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (canUseLocalAuthFallback()) {
        continueLocally("Supabase rejected this login locally. Continuing in local mode.");
        return;
      }
      toast.error(error.message);
      return;
    }

    toast.success("Signed in");
    router.replace(nextPath);
    router.refresh();
  }

  async function continueWithGoogle() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      continueLocally("Demo auth enabled");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      if (canUseLocalAuthFallback()) {
        continueLocally("Google OAuth is not configured locally. Continuing in local mode.");
        return;
      }
      toast.error(error.message);
    }
  }

  function continueLocally(message: string) {
    toast.success(message);
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(124,58,237,0.36),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.2),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0),rgba(3,7,18,1)_72%)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_420px]">
        <section className="max-w-2xl">
          <Badge className="border-white/10 bg-white/10 text-violet-100 ring-white/10">
            <Sparkles className="mr-1 h-3 w-3" />
            AI content workflow
          </Badge>
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-normal sm:text-5xl">
            Turn one podcast into 30 days of content.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Secure your workspace, track usage, and upgrade when your content
            engine starts moving faster.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Private projects", "Usage limits", "Razorpay billing"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <p className="text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-3">
            {[
              "Your next month of content is already inside one source.",
              "Repurposing is translation, not copy-paste.",
              "The best hook is hiding in the moment with tension.",
            ].map((sample, index) => (
              <motion.div
                key={sample}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-200"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.14 }}
              >
                {sample}
              </motion.div>
            ))}
          </div>
        </section>

        <Card className="border-white/10 bg-slate-950/75 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-medium tracking-normal">
                  {isSignup ? "Create your workspace" : "Sign in to Recastr"}
                </h2>
                <p className="text-sm text-slate-400">
                  {isSignup ? "Start with the free plan." : "Continue your content system."}
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {isSignup ? (
                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="name">
                    Name
                  </Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    placeholder="Abhinav"
                    {...register("name")}
                  />
                  {errors.name ? <p className="text-xs text-red-300">{errors.name.message}</p> : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  placeholder="you@company.com"
                  {...register("email")}
                />
                {errors.email ? <p className="text-xs text-red-300">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  placeholder="Minimum 8 characters"
                  {...register("password")}
                />
                {errors.password ? <p className="text-xs text-red-300">{errors.password.message}</p> : null}
              </div>

              <Button
                className={cn("w-full bg-white text-slate-950 hover:bg-slate-200", isSubmitting && "opacity-80")}
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSignup ? "Create account" : "Sign in"}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              or
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <Button
              className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={continueWithGoogle}
              type="button"
              variant="secondary"
            >
              Continue with Google
            </Button>

            {canUseLocalAuthFallback() ? (
              <Button
                className="mt-3 w-full border-violet-300/20 bg-violet-400/10 text-violet-100 hover:bg-violet-400/15"
                onClick={() => continueLocally("Continuing in local mode")}
                type="button"
                variant="secondary"
              >
                Continue in local mode
              </Button>
            ) : null}

            <p className="mt-5 text-center text-sm text-slate-400">
              {isSignup ? "Already have an account?" : "New to Recastr?"}{" "}
              <Link
                className="font-medium text-violet-200 hover:text-white"
                href={`${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(nextPath)}`}
              >
                {isSignup ? "Sign in" : "Create account"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function normalizeNextPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function canUseLocalAuthFallback() {
  return (
    process.env.NODE_ENV !== "production" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
