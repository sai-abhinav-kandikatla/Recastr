"use client";

import { useEffect } from "react";

const HEARTBEAT_STORAGE_KEY = "recastr:last-scheduled-notification-heartbeat";
const HEARTBEAT_INTERVAL_MS = 60_000;
const INITIAL_HEARTBEAT_DELAY_MS = 12_000;

export function ScheduledNotificationHeartbeat({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function processDueNotifications() {
      try {
        if (cancelled || document.visibilityState === "hidden") return;
        if (!claimHeartbeatSlot()) return;

        const response = await fetch("/api/cron/scheduled-notifications", {
          cache: "no-store",
        });

        if (!response.ok && process.env.NODE_ENV !== "production") {
          console.error("Scheduled notification heartbeat failed:", response.status);
        }
      } catch (error) {
        console.error("Scheduled notification heartbeat error:", error);
      }
    }

    const initialTimer = window.setTimeout(() => {
      void processDueNotifications();
    }, INITIAL_HEARTBEAT_DELAY_MS);
    const interval = window.setInterval(() => {
      void processDueNotifications();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void processDueNotifications();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled]);

  return null;
}

function claimHeartbeatSlot() {
  try {
    const previous = Number(window.localStorage.getItem(HEARTBEAT_STORAGE_KEY) ?? 0);
    const now = Date.now();
    if (now - previous < HEARTBEAT_INTERVAL_MS) return false;
    window.localStorage.setItem(HEARTBEAT_STORAGE_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}
