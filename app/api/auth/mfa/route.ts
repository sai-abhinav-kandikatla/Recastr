import { err, ok } from "@/lib/api-response";
import { recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return err("Unauthorized", "unauthorized", 401);
  }

  const [factorResult, aalResult] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (factorResult.error) {
    await recordSecurityEvent({
      action: "auth.mfa_status_failed",
      request,
      userId: user.id,
    });
    return err("Could not load MFA status", "mfa_status_failed", 400);
  }

  const factors = factorResult.data.totp.map((factor) => ({
    friendlyName: factor.friendly_name ?? "Authenticator app",
    id: factor.id,
    status: factor.status,
  }));

  return ok({
    currentLevel: aalResult.data?.currentLevel ?? "aal1",
    factors,
    nextLevel: aalResult.data?.nextLevel ?? "aal1",
  });
}
