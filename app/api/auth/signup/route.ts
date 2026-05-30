import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ensureUserRecord } from "@/lib/auth";
import { apiError } from "@/lib/api/response";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        {
          error: "Server signup is not configured",
          code: "signup_admin_unavailable",
          status: 503,
        },
        { status: 503 },
      );
    }

    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        name: payload.name || payload.email.split("@")[0],
      },
    });

    if (error) {
      const alreadyExists = /already|registered|exists/i.test(error.message);
      return Response.json(
        {
          error: alreadyExists ? "Account already exists. Sign in instead." : error.message,
          code: alreadyExists ? "user_exists" : "signup_failed",
          status: alreadyExists ? 409 : 400,
        },
        { status: alreadyExists ? 409 : 400 },
      );
    }

    if (!data.user?.email) {
      return Response.json(
        {
          error: "Could not create account",
          code: "signup_failed",
          status: 400,
        },
        { status: 400 },
      );
    }

    await ensureUserRecord({
      id: data.user.id,
      email: data.user.email,
      plan: "FREE",
    });

    return Response.json({
      userId: data.user.id,
      email: data.user.email,
    });
  } catch (error) {
    return apiError(error, "signup_failed", 400);
  }
}
