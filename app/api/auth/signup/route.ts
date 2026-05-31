import { createClient } from "@supabase/supabase-js";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { z } from "zod";
import { ensureUserRecord } from "@/lib/auth";
import { apiError } from "@/lib/api/response";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    }).catch(() => null);

    if (existingUser) {
      return Response.json(
        {
          error: "An account already exists for this email. Sign in instead.",
          code: "user_exists",
          status: 409,
        },
        { status: 409 },
      );
    }

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return Response.json(
        {
          error: "Server signup is not configured",
          code: "signup_admin_unavailable",
          status: 503,
        },
        { status: 503 },
      );
    }

    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    const requestOrigin = getRequestOrigin(request);

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: createTemporaryPassword(),
      options: {
        data: {
          name: payload.name || payload.email.split("@")[0],
        },
        emailRedirectTo: `${requestOrigin}/auth/callback?source=email&next=${encodeURIComponent("/onboarding")}`,
      },
    });

    if (error) {
      return signupErrorResponse(error.message);
    }

    if (!data.user?.email) {
      return Response.json(
        {
          error: "Could not create account. Try again in a few minutes, or sign in if this email was already used.",
          code: "signup_failed",
          status: 400,
        },
        { status: 400 },
      );
    }

    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return Response.json(
        {
          error: "Account already exists. Sign in instead.",
          code: "user_exists",
          status: 409,
        },
        { status: 409 },
      );
    }

    await ensureUserRecord({
      id: data.user.id,
      email: data.user.email,
      plan: "FREE",
    });

    return Response.json({
      userId: data.user.id,
      email: data.user.email,
      verificationRequired: true,
    });
  } catch (error) {
    if (isUniqueEmailError(error)) {
      return Response.json(
        {
          error: "An account already exists for this email. Sign in instead.",
          code: "user_exists",
          status: 409,
        },
        { status: 409 },
      );
    }
    return apiError(error, "signup_failed", 400);
  }
}

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin || env.appUrl;
}

function isUniqueEmailError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("email")
  );
}

function createTemporaryPassword() {
  return `${randomBytes(24).toString("base64url")}Aa1!`;
}

function signupErrorResponse(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return Response.json(
      {
        error: "Too many verification emails were requested. Please wait a few minutes, then try again.",
        code: "email_rate_limited",
        status: 429,
      },
      { status: 429 },
    );
  }

  if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
    return Response.json(
      {
        error: "Account already exists. Sign in instead.",
        code: "user_exists",
        status: 409,
      },
      { status: 409 },
    );
  }

  if (lower.includes("invalid") && lower.includes("email")) {
    return Response.json(
      {
        error: "Enter a valid email address.",
        code: "invalid_email",
        status: 400,
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      error: message || "Could not create account",
      code: "signup_failed",
      status: 400,
    },
    { status: 400 },
  );
}
