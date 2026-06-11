import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@/lib/auth";
import { canSchedule, canUseSource, PLAN_RULES } from "@/lib/plans";
import { prisma } from "@/lib/prisma/client";
import type { Platform, SourceType } from "@/lib/types";

type LimitValue = number | "unlimited";

const ACTIVE_SCHEDULE_STATUSES = ["pending", "scheduled", "processing", "PENDING", "SCHEDULED", "PROCESSING"];

export async function assertCanCreateProject(user: AuthenticatedUser, sourceType: SourceType) {
  const rule = PLAN_RULES[user.plan];

  if (!canUseSource(user.plan, sourceType)) {
    throw planLimitResponse({
      code: "source_not_in_plan",
      message: `${rule.label} does not include ${formatSourceType(sourceType)} ingestion.`,
      plan: user.plan,
    });
  }

  await assertMonthlyLimit({
    code: "project_limit_reached",
    limit: rule.projectLimit,
    message: `${rule.label} includes ${formatLimit(rule.projectLimit)} projects per month.`,
    plan: user.plan,
    used: await countProjectsThisCycle(user.id),
    requested: 1,
  });
}

export async function assertCanGenerateContent(
  user: AuthenticatedUser,
  platforms: Platform[],
  requestedOutputs = platforms.length,
) {
  const rule = PLAN_RULES[user.plan];
  const unsupported = platforms.filter((platform) => !rule.outputPlatforms.includes(platform));

  if (unsupported.length > 0) {
    throw planLimitResponse({
      code: "platform_not_in_plan",
      message: `${rule.label} cannot generate for ${unsupported.map(formatPlatform).join(", ")}.`,
      plan: user.plan,
    });
  }

  await assertMonthlyLimit({
    code: "content_limit_reached",
    limit: rule.contentLimit,
    message: `${rule.label} includes ${formatLimit(rule.contentLimit)} generated content pieces per month.`,
    plan: user.plan,
    used: await countGeneratedContentThisCycle(user.id),
    requested: Math.max(1, requestedOutputs),
  });
}

export async function assertCanScheduleReminder(user: AuthenticatedUser, platform: Platform) {
  const rule = PLAN_RULES[user.plan];

  if (!canSchedule(user.plan, platform)) {
    throw planLimitResponse({
      code: "scheduling_not_in_plan",
      message: `${rule.label} does not include ${formatPlatform(platform)} scheduling.`,
      plan: user.plan,
    });
  }

  await assertMonthlyLimit({
    code: "schedule_limit_reached",
    limit: rule.scheduledPostLimit,
    message: `${rule.label} includes ${formatLimit(rule.scheduledPostLimit)} active scheduled reminders.`,
    plan: user.plan,
    used: await countActiveScheduledReminders(user.id),
    requested: 1,
  });
}

export function assertCanExport(user: AuthenticatedUser, format: string) {
  const normalizedFormat = format.toUpperCase();
  const rule = PLAN_RULES[user.plan];

  if (!rule.exports.includes(normalizedFormat)) {
    throw planLimitResponse({
      code: "export_not_in_plan",
      message: `${rule.label} does not include ${normalizedFormat} exports.`,
      plan: user.plan,
    });
  }
}

export async function recordGeneratedContentUsage({
  count,
  metadata,
  userId,
}: {
  count: number;
  metadata?: Record<string, unknown>;
  userId: string;
}) {
  const rows = Array.from({ length: Math.max(0, count) }, () => ({
    userId,
    eventType: "generated_post",
    metadata: metadata as Prisma.InputJsonValue | undefined,
  }));
  if (rows.length === 0) return;
  await prisma.usageEvent.createMany({ data: rows }).catch(() => undefined);
}

export function planLimitErrorResponse(error: unknown) {
  return error instanceof Response ? error : null;
}

function getCurrentCycleStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function countProjectsThisCycle(userId: string) {
  return prisma.project.count({
    where: {
      userId,
      createdAt: { gte: getCurrentCycleStart() },
    },
  });
}

async function countGeneratedContentThisCycle(userId: string) {
  const cycleStart = getCurrentCycleStart();
  const [contentRows, generatedEvents] = await Promise.all([
    prisma.content.count({
      where: {
        project: { userId },
        createdAt: { gte: cycleStart },
      },
    }),
    prisma.usageEvent.count({
      where: {
        userId,
        eventType: "generated_post",
        createdAt: { gte: cycleStart },
      },
    }),
  ]);
  return contentRows + generatedEvents;
}

async function countActiveScheduledReminders(userId: string) {
  return prisma.scheduledPost.count({
    where: {
      userId,
      status: { in: ACTIVE_SCHEDULE_STATUSES },
    },
  });
}

async function assertMonthlyLimit({
  code,
  limit,
  message,
  plan,
  requested,
  used,
}: {
  code: string;
  limit: LimitValue;
  message: string;
  plan: AuthenticatedUser["plan"];
  requested: number;
  used: number;
}) {
  if (limit === "unlimited") return;
  if (used + requested <= limit) return;

  throw planLimitResponse({
    code,
    limit,
    message,
    plan,
    requested,
    used,
  });
}

function planLimitResponse({
  code,
  limit,
  message,
  plan,
  requested,
  used,
}: {
  code: string;
  limit?: LimitValue;
  message: string;
  plan: AuthenticatedUser["plan"];
  requested?: number;
  used?: number;
}) {
  return Response.json(
    {
      error: message,
      code,
      status: 403,
      limit,
      plan,
      requested,
      upgradeUrl: "/settings?tab=billing",
      used,
    },
    { status: 403 },
  );
}

function formatLimit(value: LimitValue) {
  return value === "unlimited" ? "unlimited" : String(value);
}

function formatPlatform(value: Platform) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatSourceType(value: SourceType) {
  return formatPlatform(value as Platform);
}
