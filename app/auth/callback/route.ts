import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { ensureUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = parseOtpType(requestUrl.searchParams.get("type"));
  const source = requestUrl.searchParams.get("source");
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!code && (!tokenHash || !otpType)) {
    return NextResponse.redirect(
      new URL(`/login?verified=failed&next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: otpType!,
      });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?verified=failed&error=callback_failed&next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  const user = data.user ?? data.session?.user;
  if (user?.id && user.email) {
    await syncUser(user);
  }

  if (isEmailVerification({ otpType, source })) {
    const verifiedUrl = new URL(nextPath, request.url);
    verifiedUrl.searchParams.set("verified", "1");
    return NextResponse.redirect(verifiedUrl);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}

async function syncUser(user: User) {
  if (!user.email) return;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });

    if (!existingUser) {
      await ensureUserRecord({
        id: user.id,
        email: user.email,
        plan: "FREE",
      });
    }
  } catch {
    await ensureUserRecord({
      id: user.id,
      email: user.email,
      plan: "FREE",
    });
  }
}

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function parseOtpType(value: string | null): EmailOtpType | null {
  if (
    value === "signup" ||
    value === "email" ||
    value === "email_change" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "invite"
  ) {
    return value;
  }

  return null;
}

function isEmailVerification({
  otpType,
  source,
}: {
  otpType: EmailOtpType | null;
  source: string | null;
}) {
  if (source === "email" || source === "signup") return true;
  if (otpType === "signup" || otpType === "email") return true;
  return false;
}
