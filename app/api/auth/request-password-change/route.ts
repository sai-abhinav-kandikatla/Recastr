import { ok, err } from "@/lib/api-response";
import { checkAuthEndpointRateLimit } from "@/lib/security/auth-protection";
import { recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return err("Sign in again before changing your password.", "unauthorized", 401);
  }

  const rateLimit = await checkAuthEndpointRateLimit({
    action: "password_change_request",
    email: user.email,
    request,
  });
  if (!rateLimit.ok) {
    return Response.json(
      { data: null, error: { message: "Too many attempts. Try again later.", code: "rate_limited" } },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const origin = getRequestOrigin(request);
  const createPasswordPath = `/create-password?mode=change&verified=1&next=${encodeURIComponent(
    "/settings?tab=profile",
  )}`;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(createPasswordPath)}`;

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo,
  });

  if (error) {
    await recordSecurityEvent({
      action: "auth.password_change_email_failed",
      request,
      userId: user.id,
    });
    return err("Could not send password verification email.", "password_email_failed", 400);
  }

  await recordSecurityEvent({
    action: "auth.password_change_requested",
    request,
    userId: user.id,
  });

  return ok({ sent: true });
}

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}
