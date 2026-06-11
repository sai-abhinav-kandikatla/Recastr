import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

type AuditInput = {
  action: string;
  entityId?: string;
  entityType?: string;
  metadata?: Prisma.InputJsonValue;
  request: Request;
  userId?: string | null;
};

export async function recordSecurityEvent({
  action,
  entityId,
  entityType = "auth",
  metadata,
  request,
  userId,
}: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityId,
        entityType,
        ipHash: hashSecurityValue(getClientIp(request)),
        metadata,
        userAgent: sanitizeUserAgent(request.headers.get("user-agent")),
        userId: userId ?? undefined,
      },
    });
  } catch {
    // Security logging must never break the user-facing auth flow.
  }
}

export function hashSecurityValue(value: string | null | undefined) {
  return createHash("sha256")
    .update(value?.trim().toLowerCase() || "unknown")
    .digest("hex");
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function sanitizeUserAgent(value: string | null) {
  if (!value) return undefined;
  return value.replace(/[\r\n]/g, " ").slice(0, 240);
}
