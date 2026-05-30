import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { createPdf } from "@/lib/exporters";

export const runtime = "nodejs";

const exportFileSchema = z.object({
  projectId: z.string(),
  contentIds: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    await getRequestUser(request);
    const payload = exportFileSchema.parse(await request.json());
    return new Response(createPdf(payload.projectId), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recastr-${payload.projectId}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: "pdf_export_failed", code: "pdf_export_failed", status: 500 },
      { status: 500 },
    );
  }
}
