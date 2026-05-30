import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export type AuditLogInput = {
  userId?: string;
  organizationId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  request?: Request;
};

export async function recordAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
        ipHash: input.request ? hashIp(input.request.headers.get("x-forwarded-for")) : undefined,
        userAgent: input.request?.headers.get("user-agent")?.slice(0, 240),
      },
    });
  } catch {
    // Audit logging must never break the user-facing action.
  }
}

function hashIp(value: string | null) {
  const ip = value?.split(",")[0]?.trim();
  if (!ip) return undefined;
  return crypto.createHash("sha256").update(ip).digest("hex");
}
