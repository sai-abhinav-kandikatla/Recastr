import cron from "node-cron";
import { createRecastrWorker } from "@/lib/queue/client";

createRecastrWorker();

cron.schedule("*/5 * * * *", () => {
  if (process.env.RECASTR_DEMO_MODE === "true") return;
});
