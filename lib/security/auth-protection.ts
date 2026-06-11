import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { getClientIp, hashSecurityValue, recordSecurityEvent } from "@/lib/security/audit";

const LOGIN_FAILURE_LIMIT = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;
const LOGIN_WINDOW_SECONDS = 10 * 60;
const IP_RATE_LIMIT = 30;
const IDENTIFIER_RATE_LIMIT = 12;

type GuardResult =
  | { ok: true }
  | { ok: false; retryAfter?: number; status: 429 };

type MemoryEntry = {
  expiresAt: number;
  value: string;
};

const memoryStore = new Map<string, MemoryEntry>();
let redisClient: Redis | null = null;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function checkLoginProtection({
  email,
  request,
}: {
  email: string;
  request: Request;
}): Promise<GuardResult> {
  const ip = getClientIp(request);
  const ipHash = hashSecurityValue(ip);
  const identifierHash = hashSecurityValue(normalizeEmail(email));
  const lockKey = key("lock", identifierHash);
  const lockedUntil = await readNumber(lockKey);

  if (lockedUntil && lockedUntil > Date.now()) {
    await recordSecurityEvent({
      action: "auth.login_locked",
      metadata: { identifierHash },
      request,
    });
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000)),
      status: 429,
    };
  }

  const [ipAttempts, identifierAttempts] = await Promise.all([
    incrementWindow(key("ip", ipHash), LOGIN_WINDOW_SECONDS),
    incrementWindow(key("identifier", identifierHash), LOGIN_WINDOW_SECONDS),
  ]);

  if (ipAttempts > IP_RATE_LIMIT || identifierAttempts > IDENTIFIER_RATE_LIMIT) {
    await recordSecurityEvent({
      action: "auth.login_rate_limited",
      metadata: { identifierHash, ipAttempts, identifierAttempts },
      request,
    });
    return { ok: false, retryAfter: LOGIN_WINDOW_SECONDS, status: 429 };
  }

  return { ok: true };
}

export async function registerFailedLogin({
  email,
  request,
}: {
  email: string;
  request: Request;
}) {
  const identifierHash = hashSecurityValue(normalizeEmail(email));
  const failureCount = await incrementWindow(key("failures", identifierHash), 60 * 60);

  if (failureCount >= LOGIN_FAILURE_LIMIT) {
    await writeNumber(key("lock", identifierHash), Date.now() + LOGIN_LOCK_SECONDS * 1000, LOGIN_LOCK_SECONDS);
  }

  await recordSecurityEvent({
    action: failureCount >= LOGIN_FAILURE_LIMIT ? "auth.login_lock_created" : "auth.login_failed",
    metadata: { failureCount, identifierHash },
    request,
  });
}

export async function registerSuccessfulLogin({
  email,
  request,
  userId,
}: {
  email: string;
  request: Request;
  userId?: string;
}) {
  const identifierHash = hashSecurityValue(normalizeEmail(email));
  await Promise.all([
    deleteKey(key("failures", identifierHash)),
    deleteKey(key("lock", identifierHash)),
  ]);

  await recordSecurityEvent({
    action: "auth.login_success",
    metadata: { identifierHash },
    request,
    userId,
  });
}

export async function checkAuthEndpointRateLimit({
  action,
  email,
  request,
}: {
  action: string;
  email?: string;
  request: Request;
}) {
  const ipHash = hashSecurityValue(getClientIp(request));
  const identifierHash = email ? hashSecurityValue(normalizeEmail(email)) : undefined;
  const attempts = await incrementWindow(key(action, `${ipHash}:${identifierHash ?? "anonymous"}`), LOGIN_WINDOW_SECONDS);

  if (attempts > IDENTIFIER_RATE_LIMIT) {
    await recordSecurityEvent({
      action: `auth.${action}_rate_limited`,
      metadata: identifierHash ? { identifierHash } : undefined,
      request,
    });
    return { ok: false as const, retryAfter: LOGIN_WINDOW_SECONDS };
  }

  return { ok: true as const };
}

function key(type: string, id: string) {
  return `recastr:auth:${type}:${id}`;
}

async function incrementWindow(storageKey: string, seconds: number) {
  const redis = getRedis();
  if (redis) {
    const value = await redis.incr(storageKey);
    if (value === 1) await redis.expire(storageKey, seconds);
    return value;
  }

  const now = Date.now();
  const existing = memoryStore.get(storageKey);
  if (!existing || existing.expiresAt < now) {
    memoryStore.set(storageKey, { expiresAt: now + seconds * 1000, value: "1" });
    return 1;
  }

  const next = Number(existing.value) + 1;
  existing.value = String(next);
  return next;
}

async function readNumber(storageKey: string) {
  const redis = getRedis();
  if (redis) {
    const value = await redis.get<number | string>(storageKey);
    return value ? Number(value) : null;
  }

  const existing = memoryStore.get(storageKey);
  if (!existing || existing.expiresAt < Date.now()) {
    memoryStore.delete(storageKey);
    return null;
  }
  return Number(existing.value);
}

async function writeNumber(storageKey: string, value: number, seconds: number) {
  const redis = getRedis();
  if (redis) {
    await redis.set(storageKey, value, { ex: seconds });
    return;
  }
  memoryStore.set(storageKey, { expiresAt: Date.now() + seconds * 1000, value: String(value) });
}

async function deleteKey(storageKey: string) {
  const redis = getRedis();
  if (redis) {
    await redis.del(storageKey);
    return;
  }
  memoryStore.delete(storageKey);
}

function getRedis() {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  redisClient ??= new Redis({
    token: env.UPSTASH_REDIS_REST_TOKEN,
    url: env.UPSTASH_REDIS_REST_URL,
  });
  return redisClient;
}
