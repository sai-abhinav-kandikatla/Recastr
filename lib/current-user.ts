import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string;
  plan: Plan;
};

const localDevUser: CurrentUser = {
  id: "local-user",
  email: "local@recastr.app",
  name: "Local workspace",
  plan: "PRO",
};

const demoUser: CurrentUser = {
  id: "demo-user",
  email: "demo@recastr.app",
  name: "Demo user",
  plan: "PRO",
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const canUseDemoUser = env.demoMode && !env.requireAuth;

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    if (canUseDemoUser) return demoUser;
    if (process.env.NODE_ENV !== "production" && !env.requireAuth) return localDevUser;
    return null;
  }

  const supabase = createSupabaseServerClient();
  const fallback = getAuthFallback(canUseDemoUser);

  let authUser;
  let authError;
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    authUser = user;
    authError = error;
  } catch {
    return fallback;
  }

  if (authError || !authUser?.email) {
    return fallback;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
      },
    });

    if (dbUser) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name ?? undefined,
        plan: normalizePlan(dbUser.plan),
      };
    }
  } catch {
    return getAuthUserFallback(authUser);
  }

  try {
    const createdUser = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name,
        avatarUrl: authUser.user_metadata?.avatar_url,
        plan: "free",
        platforms: [],
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
      },
    });

    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name ?? undefined,
      plan: normalizePlan(createdUser.plan),
    };
  } catch {
    return getAuthUserFallback(authUser);
  }
}

function getAuthFallback(canUseDemoUser: boolean) {
  if (canUseDemoUser) return demoUser;
  if (process.env.NODE_ENV !== "production" && !env.requireAuth) return localDevUser;
  return null;
}

function normalizePlan(value: unknown): Plan {
  const plan = String(value ?? "FREE").toUpperCase();
  if (plan === "PRO" || plan === "TEAM" || plan === "AGENCY") return plan;
  return "FREE";
}

function getAuthUserFallback(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): CurrentUser | null {
  if (!authUser.email) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : undefined,
    plan: normalizePlan(authUser.user_metadata?.plan),
  };
}

export async function requireCurrentUser(nextPath = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
