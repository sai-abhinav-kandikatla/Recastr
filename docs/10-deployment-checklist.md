# Production deployment checklist

## Required environment variables

Server:
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `REDIS_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Client:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

Flags:
- `RECASTR_DEMO_MODE=false`
- `REQUIRE_AUTH=true`

## Vercel

1. Set all production env vars.
2. Set build command: `npm run build`.
3. Set install command: `npm install`.
4. Confirm Node runtime API routes do not run in Edge.
5. Add production domain to Supabase auth redirect URLs.
6. Add production domain to Razorpay webhook settings.

## Supabase

1. Rotate database password before launch.
2. Apply Prisma migration.
3. Enable RLS policies.
4. Configure auth providers.
5. Add app domains to redirect URL allow-list.
6. Configure Storage bucket for avatars if enabled.

## Redis and queue

1. Configure Upstash Redis REST envs for rate limiting.
2. Configure `REDIS_URL` for BullMQ workers.
3. Run worker in a persistent environment, not Vercel serverless.
4. Add dead-letter/retry monitoring before enabling publishing.

## Media pipeline

1. Confirm FFmpeg binary availability.
2. Confirm yt-dlp availability.
3. Add fallback for environments without system binaries.
4. Use background jobs for audio longer than 10 minutes.
5. Cache transcripts by file hash.

## Pre-deploy commands

```bash
npm run security:scan
npm run lint
npx tsc --noEmit
npx prisma generate
npm run build
```

## Post-deploy smoke test

1. Open `/`.
2. Sign up.
3. Complete onboarding.
4. Paste demo source.
5. Generate content.
6. Edit content.
7. Verify phone preview updates.
8. Copy content.
9. Export PDF.
10. Start Razorpay test checkout.
