import { getRequestUser, type AuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { recordSecurityEvent } from "@/lib/security/audit";

export type Role = AuthenticatedUser["role"];

const roleRank: Record<Role, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function hasRole(userRole: Role, minimumRole: Role) {
  return roleRank[userRole] >= roleRank[minimumRole];
}

export async function requireRole(request: Request, minimumRole: Role) {
  const user = await getRequestUser(request);

  if (hasRole(user.role, minimumRole)) return user;

  await recordSecurityEvent({
    action: "auth.rbac_denied",
    metadata: {
      minimumRole,
      userRole: user.role,
    },
    request,
    userId: user.id,
  });

  throw new Response("Forbidden", { status: 403 });
}

export async function requireOrganizationRole(request: Request, organizationId: string, minimumRole: Role) {
  const user = await getRequestUser(request);
  if (hasRole(user.role, minimumRole)) return user;

  const membership = await prisma.organizationMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
    select: { role: true },
  });
  const membershipRole = normalizeRole(membership?.role);

  if (hasRole(membershipRole, minimumRole)) return user;

  await recordSecurityEvent({
    action: "auth.organization_rbac_denied",
    metadata: {
      minimumRole,
      organizationId,
      userRole: user.role,
      workspaceRole: membershipRole,
    },
    request,
    userId: user.id,
  });

  throw new Response("Forbidden", { status: 403 });
}

function normalizeRole(value: unknown): Role {
  const role = String(value ?? "member").toLowerCase();
  if (role === "owner" || role === "admin") return role;
  return "member";
}
