import { Api } from "grammy";

const BOT_TOKEN = process.env.BOT_TOKEN || "";

export const telegramApi = new Api(BOT_TOKEN);
