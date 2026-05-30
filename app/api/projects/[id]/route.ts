import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { getProject } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { serializeProject } from "@/lib/projects/serialize";
import { getStoredProject } from "@/lib/projects/store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getRequestUser(request);
  const demoProject = getProject(params.id);
  if (demoProject) return NextResponse.json(demoProject);

  if (isDemoMode()) {
    const storedProject = getStoredProject(params.id);
    if (storedProject) return NextResponse.json(storedProject);
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: { contents: true, hooks: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(serializeProject(project));
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
