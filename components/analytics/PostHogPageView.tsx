"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof navigator === "undefined") return;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
    const payload = JSON.stringify({
      api_key: key,
      event: "$pageview",
      properties: {
        $current_url: `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`,
      },
    });
    navigator.sendBeacon(`${host}/capture/`, payload);
  }, [pathname, searchParams]);

  return null;
}
