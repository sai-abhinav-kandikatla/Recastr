import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { checkAuthEndpointRateLimit } from "@/lib/security/auth-protection";
import { recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enrollSchema = z.object({
  friendlyName: z.string().trim().min(1).max(60).optional(),
});

export async function POST(request: Request) {
  const parsed = enrollSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err("Invalid request", "validation_error", 400);

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return err("Unauthorized", "unauthorized", 401);
  }

  const rateLimit = await checkAuthEndpointRateLimit({
    action: "mfa_enroll",
    email: user.email,
    request,
  });
  if (!rateLimit.ok) {
    return Response.json(
      { data: null, error: { message: "Too many attempts. Try again later.", code: "rate_limited" } },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: parsed.data.friendlyName ?? "Recastr authenticator",
  });

  if (error) {
    await recordSecurityEvent({
      action: "auth.mfa_enroll_failed",
      request,
      userId: user.id,
    });
    return err("Could not start MFA setup", "mfa_enroll_failed", 400);
  }

  await recordSecurityEvent({
    action: "auth.mfa_enroll_started",
    request,
    userId: user.id,
  });

  return ok({
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  });
}
