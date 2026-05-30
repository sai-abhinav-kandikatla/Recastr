# Feature roadmap

## Phase 0: Security and demo reliability

Status: In progress.

- Rotate exposed secrets.
- Keep demo mode deterministic.
- Remove demo/live data confusion.
- Add env validation and secret scanning.
- Verify project pages, ingest, hook generation, preview, copy, export.

## Phase 1: Core paid product

- Real YouTube transcription pipeline.
- Blog ingestion with robust extraction.
- Raw text ingestion with source intelligence.
- Viral Hook Intelligence ranking.
- Generate X, LinkedIn, Instagram caption, Reel script, YouTube Community post.
- Inline edit, copy, export.
- Usage tracking by plan.

## Phase 2: Monetization and retention

- Razorpay production checkout.
- Webhook idempotency.
- Usage limit enforcement.
- Upgrade prompts at project limit and export limit.
- Billing page with invoice history.
- Weekly content digest email.

## Phase 3: Team and agency

- Organizations and memberships.
- Shared projects.
- Brand voice profiles per client.
- Team export bundles.
- Audit log viewer for admins.

## Phase 4: Scheduling and integrations

- Twitter and LinkedIn OAuth.
- Calendar queue.
- Scheduled publishing workers.
- Failed publish retries.
- Integration health page.

## Phase 5: Analytics

- PostHog event funnels.
- Export analytics.
- Generation quality feedback.
- Content performance sync from platforms.

## Near-term engineering priorities

1. Persist content edits with PATCH API.
2. Add source transcript paste flow after failed YouTube extraction.
3. Add production Razorpay webhook idempotency.
4. Add organization membership authorization helper.
5. Add CI pipeline: lint, typecheck, secret scan, build.
