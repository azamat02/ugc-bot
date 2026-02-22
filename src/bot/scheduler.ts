import { prisma } from "../db/prisma";
import { executeBroadcast } from "./broadcast";

export function startBroadcastScheduler() {
  setInterval(async () => {
    try {
      const due = await prisma.broadcast.findMany({
        where: {
          status: "scheduled",
          scheduledAt: { lte: new Date() },
        },
      });

      for (const broadcast of due) {
        executeBroadcast(broadcast.id).catch((err) => {
          console.error(`Scheduler: failed to execute broadcast ${broadcast.id}`, err);
        });
      }
    } catch (err) {
      console.error("Broadcast scheduler error:", err);
    }
  }, 30_000);

  console.log("Broadcast scheduler started (30s interval)");
}
