import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { ensureUserRecord } from "@/lib/auth";
import { checkAuthEndpointRateLimit, registerSuccessfulLogin } from "@/lib/security/auth-protection";
import { recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Use a 6 digit code"),
  factorId: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return err("Invalid verification code", "invalid_mfa_code", 400);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return err("Unauthorized", "unauthorized", 401);
  }

  const rateLimit = await checkAuthEndpointRateLimit({
    action: "mfa_verify",
    email: user.email,
    request,
  });
  if (!rateLimit.ok) {
    return Response.json(
      { data: null, error: { message: "Too many attempts. Try again later.", code: "rate_limited" } },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const challenge = await supabase.auth.mfa.challenge({
    factorId: parsed.data.factorId,
  });
  if (challenge.error) {
    await recordSecurityEvent({
      action: "auth.mfa_challenge_failed",
      request,
      userId: user.id,
    });
    return err("Could not verify MFA code", "mfa_challenge_failed", 400);
  }

  const verification = await supabase.auth.mfa.verify({
    challengeId: challenge.data.id,
    code: parsed.data.code,
    factorId: parsed.data.factorId,
  });

  if (verification.error) {
    await recordSecurityEvent({
      action: "auth.mfa_verify_failed",
      request,
      userId: user.id,
    });
    return err("Invalid verification code", "invalid_mfa_code", 400);
  }

  const userRecord = await ensureUserRecord({
    email: user.email,
    id: user.id,
    plan: "FREE",
  });

  await registerSuccessfulLogin({
    email: user.email,
    request,
    userId: userRecord.id,
  });

  await recordSecurityEvent({
    action: "auth.mfa_verified",
    request,
    userId: userRecord.id,
  });

  return ok({ verified: true });
}
