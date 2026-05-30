# Launch checklist

## Product

- Landing page final copy approved.
- Demo flow completes under 90 seconds.
- Three demo projects load instantly.
- YouTube URL fallback never returns unrelated demo content.
- Phone preview is visible and updates from edits.
- Copy/export buttons work.
- Empty states exist for dashboard, schedule, and settings.

## Engineering

- `npm run security:scan` passes.
- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Prisma client generated.
- Supabase migrations applied.
- Seed script tested against staging.

## Security

- Exposed credentials rotated.
- `.env` and `.env.local` ignored.
- Production env validation tested.
- Razorpay webhook secret configured.
- Supabase RLS policies enabled.
- CORS domain set to production app URL.

## Analytics

- PostHog or Plausible configured.
- Events tracked:
  - landing CTA clicked
  - signup completed
  - onboarding completed
  - source ingested
  - hook generated
  - content copied
  - export downloaded
  - checkout started
  - payment captured

## Billing

- Razorpay test payment succeeds.
- Razorpay webhook updates user plan.
- Duplicate webhook does not double-apply.
- Billing page shows current plan.

## Support

- Add support email.
- Add privacy policy.
- Add terms of service.
- Add refund policy if selling subscriptions.

## Marketing

- Product Hunt assets prepared.
- Demo video recorded.
- Founder story post drafted.
- 10 beta testimonials requested.
- Launch email sequence ready.
