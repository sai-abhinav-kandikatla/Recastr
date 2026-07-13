import { err, ok } from "@/lib/api-response";
import { recordSecurityEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.auth.signOut();
  if (error) return err("Could not sign out. Try again.", "logout_failed", 400);

  await recordSecurityEvent({
    action: "auth.logout",
    request,
    userId: user?.id,
  });

  return ok({ signedOut: true });
}
