# Security report

## High-priority findings

### Secret exposure risk

Status: Partially mitigated.

Findings:
- Local `.env` and `.env.local` files contain sensitive values and must never be committed.
- `.gitignore` correctly excludes `.env` and `.env*.local`.
- A repo secret scanner was added as `npm run security:scan`.

Required operator action:
- Rotate any keys that were pasted into chat or previously committed.
- Rotate Supabase database password, Supabase service role key, and OpenAI key before production use.

### Demo/live mode confusion

Status: Fixed in core routes.

Findings:
- Some API routes returned demo data when `user.id === "demo-user"`.
- This caused live YouTube imports to appear like demo content.

Fixes:
- `getRequestUser` now returns a separate `local-user` fallback when auth is not required.
- Core project, text ingest, and schedule APIs now check explicit `RECASTR_DEMO_MODE` instead of user id.

### Authorization gaps

Status: Improved.

Findings:
- Scheduling accepted any `contentId` without verifying ownership.

Fixes:
- `/api/schedule` now verifies that the content belongs to a project owned by the authenticated user.

Remaining work:
- Add PATCH/DELETE content APIs with the same ownership guard.
- Add organization-level membership checks before team launch.

### Production environment validation

Status: Fixed.

Fixes:
- `lib/env.ts` validates production envs.
- Production startup fails if required Supabase/database values are missing.
- Production startup fails if server-only secrets are accidentally exposed with `NEXT_PUBLIC_`.

### CORS and middleware

Status: Acceptable.

Findings:
- Middleware avoids Prisma imports and stays Edge-compatible.
- Login/signup are exempt from auth redirects.
- API CORS denies unknown origins when `NEXT_PUBLIC_APP_URL` is configured.

Remaining work:
- Set `NEXT_PUBLIC_APP_URL` exactly to the production domain in Vercel.
- Add preview deployment origin allow-list if using Vercel preview links.

### Rate limiting

Status: Present.

Findings:
- Ingest and generation routes use Upstash when configured and an in-memory fallback locally.

Remaining work:
- Add rate limiting to billing, auth-sensitive custom endpoints, and export routes.

### Webhooks

Status: Mostly secure.

Findings:
- Razorpay webhook verifies HMAC signature with timing-safe comparison.

Remaining work:
- Require `RAZORPAY_WEBHOOK_SECRET` in production.
- Store payment id/order id to make webhook processing idempotent.

## Implemented security controls

- Secret scanner: `scripts/scan-secrets.mjs`
- Production env validation: `lib/env.ts`
- Lazy queue initialization with demo-safe null queue
- Auth fallback separation: demo user vs local development user
- Project/content ownership checks for scheduling
- Audit log model and runtime helper
- Security headers in `next.config.mjs`

## Recommended security backlog

1. Rotate all exposed credentials before push/deploy.
2. Enable Supabase RLS policies for user-owned tables.
3. Encrypt connected account tokens using Supabase Vault or app-level KMS.
4. Add idempotency keys for billing and scheduled publishing.
5. Add structured request logging without request bodies.
6. Add Sentry or equivalent for server errors.
7. Add dependency scanning in CI.
8. Add a security checklist to every release PR.
