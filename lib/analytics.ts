type AnalyticsEvent =
  | "source_ingested"
  | "content_generated"
  | "content_exported"
  | "tone_rewritten"
  | "checkout_started";

type AnalyticsPayload = {
  userId?: string;
  projectId?: string;
  plan?: string;
  format?: string;
  platform?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function trackServerEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (process.env.RECASTR_DEMO_MODE === "true") return;

  const posthogKey = process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.POSTHOG_HOST ?? "https://app.posthog.com";
  if (posthogKey) {
    await fetch(`${posthogHost.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: posthogKey,
        event,
        distinct_id: payload.userId ?? "anonymous",
        properties: payload,
      }),
    }).catch(() => undefined);
    return;
  }

  const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;
  const plausibleHost = process.env.PLAUSIBLE_HOST ?? "https://plausible.io";
  if (!plausibleDomain) return;

  await fetch(`${plausibleHost.replace(/\/$/, "")}/api/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Recastr/1.0" },
    body: JSON.stringify({
      name: event,
      url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      domain: plausibleDomain,
      props: payload.metadata,
    }),
  }).catch(() => undefined);
}
