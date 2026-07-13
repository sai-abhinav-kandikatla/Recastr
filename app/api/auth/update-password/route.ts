import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { checkAuthEndpointRateLimit } from "@/lib/security/auth-protection";
import { recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updatePasswordSchema = z.object({
  invalidateSessions: z.boolean().optional(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = updatePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return err("Invalid request", "validation_error", 400);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return err("Your secure session has expired. Request a new password link.", "unauthorized", 401);
  }

  const rateLimit = await checkAuthEndpointRateLimit({
    action: "password_update",
    email: user.email,
    request,
  });
  if (!rateLimit.ok) {
    return Response.json(
      { data: null, error: { message: "Too many attempts. Try again later.", code: "rate_limited" } },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    await recordSecurityEvent({
      action: "auth.password_update_failed",
      request,
      userId: user.id,
    });
    return err("Could not update password. Try again.", "password_update_failed", 400);
  }

  await recordSecurityEvent({
    action: "auth.password_updated",
    request,
    userId: user.id,
  });

  if (parsed.data.invalidateSessions) {
    await supabase.auth.signOut({ scope: "global" });
  }

  return ok({ passwordUpdated: true, sessionsInvalidated: Boolean(parsed.data.invalidateSessions) });
}
