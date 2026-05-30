import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(request);
    if (process.env.RECASTR_DEMO_MODE === "true" || params.id.startsWith("demo-job")) {
      return Response.json(demoProgress(params.id));
    }

    const job = await prisma.jobRecord.findFirst({
      where: {
        id: params.id,
        OR: [{ userId: user.id }, { userId: null }],
      },
    });

    if (!job) {
      return Response.json({ error: "job_not_found", code: "job_not_found", status: 404 }, { status: 404 });
    }

    return Response.json({
      status: normalizeStatus(job.status),
      progress: job.progress,
      result: job.result,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: "job_status_failed", code: "job_status_failed", status: 500 },
      { status: 500 },
    );
  }
}

function demoProgress(id: string) {
  const createdAt = Number(id.split("-").at(-1)) || Date.now();
  const elapsed = Math.max(0, Date.now() - createdAt);
  const progress = Math.min(100, Math.round(elapsed / 60));
  return {
    status: progress >= 100 ? "complete" : progress > 15 ? "processing" : "pending",
    progress,
    result: progress >= 100 ? { message: "Demo batch generated" } : undefined,
  };
}

function normalizeStatus(value: string) {
  const status = value.toLowerCase();
  if (status.includes("fail")) return "failed";
  if (status.includes("complete") || status.includes("published")) return "complete";
  if (status.includes("process")) return "processing";
  return "pending";
}
