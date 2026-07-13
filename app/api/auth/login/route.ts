import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { ensureUserRecord } from "@/lib/auth";
import {
  checkLoginProtection,
  normalizeEmail,
  registerFailedLogin,
  registerSuccessfulLogin,
} from "@/lib/security/auth-protection";
import { hashSecurityValue, recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return err("Invalid credentials", "invalid_credentials", 401);

  const { email, password } = parsed.data;
  const guard = await checkLoginProtection({ email, request });

  if (!guard.ok) {
    return Response.json(
      { data: null, error: { message: "Too many attempts. Try again later.", code: "rate_limited" } },
      {
        headers: guard.retryAfter ? { "Retry-After": String(guard.retryAfter) } : undefined,
        status: guard.status,
      },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    await registerFailedLogin({ email, request });
    return err("Invalid credentials", "invalid_credentials", 401);
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut({ scope: "global" });
    await recordSecurityEvent({
      action: "auth.login_unverified_email",
      metadata: { identifierHash: hashSecurityValue(normalizeEmail(email)) },
      request,
    });
    return err("Verify your email before continuing.", "email_not_verified", 403);
  }

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data?.nextLevel === "aal2" && aal.data.currentLevel !== "aal2") {
    const factorResult = await supabase.auth.mfa.listFactors();
    const factors = factorResult.data?.totp
      .filter((factor) => factor.status === "verified")
      .map((factor) => ({
        friendlyName: factor.friendly_name ?? "Authenticator app",
        id: factor.id,
      })) ?? [];

    await recordSecurityEvent({
      action: "auth.login_mfa_required",
      metadata: { identifierHash: hashSecurityValue(normalizeEmail(email)) },
      request,
      userId: data.user.id,
    });

    if (factors.length > 0) {
      return ok({
        factors,
        mfaRequired: true,
        signedIn: false,
      });
    }
  }

  const userRecord = await ensureUserRecord({
    email: data.user.email,
    id: data.user.id,
    plan: "FREE",
  });

  await registerSuccessfulLogin({
    email: data.user.email,
    request,
    userId: userRecord.id,
  });

  return ok({ signedIn: true });
}
