import { prisma } from "@/lib/prisma/client";

type AuditAction =
  | "USER_SIGNUP"
  | "USER_LOGIN"
  | "PROJECT_CREATED"
  | "PROJECT_DELETED"
  | "CONTENT_GENERATED"
  | "CONTENT_SCHEDULED"
  | "CONTENT_PUBLISHED"
  | "ORG_CREATED"
  | "ORG_MEMBER_INVITED"
  | "ORG_MEMBER_JOINED"
  | "ORG_MEMBER_REMOVED"
  | "SUBSCRIPTION_UPDATED"
  | "BILLING_INVOICE_PAID";

interface LogAuditParams {
  userId?: string;
  organizationId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  req?: Request;
}

export async function logAudit({
  userId,
  organizationId,
  action,
  entityType,
  entityId,
  metadata,
  req,
}: LogAuditParams) {
  try {
    // Extract IP and User-Agent if request is provided
    let ipHash = undefined;
    let userAgent = undefined;
    
    if (req) {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      // Basic anonymization hash (we shouldn't store raw IPs in audit logs unless necessary)
      ipHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip))))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16);
      
      userAgent = req.headers.get("user-agent") || undefined;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        organizationId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ipHash,
        userAgent,
      },
    });
  } catch (error) {
    // We don't want audit logging failures to crash the main request
    console.error("Failed to write audit log:", error);
  }
}
