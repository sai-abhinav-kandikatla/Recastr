import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import { getRequestUser } from "@/lib/auth";
import { sendTestEmail, verifyEmailTransport } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testEmailSchema = z.object({
  to: z.string().email().optional(),
});

export async function GET(request: Request) {
  try {
    await getRequestUser(request);
    const result = await verifyEmailTransport();
    return ok(result);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Email transport check failed", "email_check_failed", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    const payload = testEmailSchema.parse(await request.json().catch(() => ({})));
    await sendTestEmail(payload.to ?? user.email);
    return ok({ sent: true, to: payload.to ?? user.email });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Test email failed", "test_email_failed", 500);
  }
}
