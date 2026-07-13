import { err, ok } from "@/lib/api-response";
import { checkAuthEndpointRateLimit } from "@/lib/security/auth-protection";
import { recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ factorId: string }> }) {
  const { factorId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return err("Unauthorized", "unauthorized", 401);
  }

  const rateLimit = await checkAuthEndpointRateLimit({
    action: "mfa_unenroll",
    email: user.email,
    request,
  });
  if (!rateLimit.ok) {
    return Response.json(
      { data: null, error: { message: "Too many attempts. Try again later.", code: "rate_limited" } },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    await recordSecurityEvent({
      action: "auth.mfa_unenroll_failed",
      request,
      userId: user.id,
    });
    return err("Could not disable MFA", "mfa_unenroll_failed", 400);
  }

  await recordSecurityEvent({
    action: "auth.mfa_unenrolled",
    request,
    userId: user.id,
  });

  return ok({ disabled: true });
}
