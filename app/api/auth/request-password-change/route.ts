import { ok, err } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return err("Sign in again before changing your password.", "unauthorized", 401);
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
    return err(error.message || "Could not send password verification email.", "password_email_failed", 400);
  }

  return ok({ email: user.email });
}

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}
