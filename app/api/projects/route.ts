import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureUserRecord, getRequestUser } from "@/lib/auth";
import { demoProjects } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { serializeProject } from "@/lib/projects/serialize";
import { saveStoredProject } from "@/lib/projects/store";
import { apiError } from "@/lib/api/response";
import { recordAuditLog } from "@/lib/audit-log";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";

const createProjectSchema = z.object({
  title: z.string().trim().min(3).max(120),
  sourceType: z.enum(["YOUTUBE", "PODCAST", "BLOG", "TEXT"]).default("TEXT"),
  transcript: z.string().trim().max(100_000).default(""),
});

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (isDemoMode()) {
    return NextResponse.json(demoProjects);
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: { contents: true, hooks: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects.map(serializeProject));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    const body = createProjectSchema.parse(await request.json());
    const createdAt = new Date().toISOString();

    if (isDemoMode()) {
      const project = {
        ...demoProjects[0],
        id: `demo-created-${Date.now()}`,
        title: body.title,
        sourceType: body.sourceType,
        transcript: body.transcript || demoProjects[0].transcript,
        createdAt,
        updatedAt: createdAt,
        status: "DRAFT",
      } satisfies Project;
      saveStoredProject(project);
      return NextResponse.json(project, { status: 201 });
    }

    await ensureUserRecord(user);
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: body.title,
        sourceType: body.sourceType.toLowerCase(),
        transcript: body.transcript,
        wordCount: body.transcript.split(/\s+/).filter(Boolean).length,
      },
      include: { contents: true, hooks: true },
    });
    await recordAuditLog({
      userId: user.id,
      action: "project_created",
      entityType: "project",
      entityId: project.id,
      metadata: { sourceType: body.sourceType },
      request,
    });

    return NextResponse.json(serializeProject(project), { status: 201 });
  } catch (error) {
    return apiError(error, "project_create_failed", 400);
  }
}
