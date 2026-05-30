import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const memoryWindow = new Map<string, { count: number; resetAt: number }>();

export async function assertGenerationRateLimit(userId: string) {
  return assertRateLimit({
    userId,
    limit: 10,
    prefix: "recastr:generation",
  });
}

export async function assertIngestRateLimit(userId: string) {
  return assertRateLimit({
    userId,
    limit: 5,
    prefix: "recastr:ingest",
  });
}

async function assertRateLimit({
  userId,
  limit,
  prefix,
}: {
  userId: string;
  limit: number;
  prefix: string;
}) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, "1 m"),
      analytics: true,
      prefix,
    });
    const result = await ratelimit.limit(userId);
    if (!result.success) {
      throw new Response(
        JSON.stringify({
          error: "rate_limit",
          code: "rate_limit",
          retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        }),
        { status: 429 },
      );
    }
    return;
  }

  const now = Date.now();
  const key = `${prefix}:${userId}`;
  const entry = memoryWindow.get(key);
  if (!entry || entry.resetAt < now) {
    memoryWindow.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (entry.count >= limit) {
    throw new Response(
      JSON.stringify({
        error: "rate_limit",
        code: "rate_limit",
        retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      }),
      { status: 429 },
    );
  }
  entry.count += 1;
}
