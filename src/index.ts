import "dotenv/config";
import { createBot } from "./bot";
import { createApi } from "./api";
import { startBroadcastScheduler } from "./bot/scheduler";

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = parseInt(process.env.PORT || "3001", 10);

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required in .env");
  process.exit(1);
}

async function main() {
  // Start Express API
  const app = createApi();
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });

  // Start Telegram bot
  const bot = createBot(BOT_TOKEN!);
  await bot.start({
    onStart: () => {
      console.log("Bot started successfully");
      startBroadcastScheduler();
    },
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
