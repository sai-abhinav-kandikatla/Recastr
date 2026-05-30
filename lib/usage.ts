import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { isDemoMode } from "@/lib/env";

export async function recordUsageEvent({
  userId,
  eventType,
  metadata,
}: {
  userId: string;
  eventType: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (isDemoMode()) return;
  await prisma.usageEvent
    .create({
      data: {
        userId,
        eventType,
        metadata,
      },
    })
    .catch(() => undefined);
}
