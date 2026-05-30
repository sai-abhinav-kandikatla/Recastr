import { ok } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  return ok({
    id: params.id,
    status: "SCHEDULED",
  });
}
