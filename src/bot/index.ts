import { Bot, Context, session } from "grammy";
import {
  conversations,
  createConversation,
  ConversationFlavor,
} from "@grammyjs/conversations";
import { checkRegistered } from "./middleware/auth";
import { handleStart, getCompanyMenuMessage } from "./handlers/start";
import { creatorConversation } from "./handlers/creator";
import { companyConversation } from "./handlers/company";
import { handleModeration, handleProjectResponse } from "../admin/telegram";
import { handleBrowseCreators, handleBrowseNav } from "./handlers/browse";
import { companyMenuKeyboard } from "./keyboards";

type MyContext = Context & ConversationFlavor;

export function createBot(token: string) {
  const bot = new Bot<MyContext>(token);

  // Session for conversations
  bot.use(
    session({
      initial: () => ({} as { greetingMessageId?: number }),
    })
  );

  // Conversations plugin
  bot.use(conversations());
  bot.use(createConversation(creatorConversation));
  bot.use(createConversation(companyConversation));

  // Auth middleware
  bot.use(checkRegistered);

  // /start command
  bot.command("start", handleStart);

  // /menu command
  bot.command("menu", async (ctx) => {
    const role = (ctx as any).userRole;
    const dbUser = (ctx as any).dbUser;

    if (role === "company") {
      await ctx.reply(getCompanyMenuMessage(dbUser.status), {
        reply_markup: companyMenuKeyboard(dbUser.status),
      });
    } else if (role === "creator") {
      await ctx.reply("ℹ️ Меню доступно только для компаний.");
    } else {
      await ctx.reply("👋 Используйте /start чтобы зарегистрироваться.");
    }
  });

  // /creators command
  bot.command("creators", async (ctx) => {
    const role = (ctx as any).userRole;
    const dbUser = (ctx as any).dbUser;

    if (role === "company" && dbUser?.status === "approved") {
      await handleBrowseCreators(ctx as any);
    } else if (role === "company") {
      await ctx.reply("⛔ Просмотр креаторов доступен только после одобрения заявки.");
    } else {
      await ctx.reply("⛔ Просмотр креаторов доступен только для компаний.");
    }
  });

  // Role selection callbacks — удаляем приветствие и входим в анкету
  bot.callbackQuery("role:creator", async (ctx) => {
    await ctx.answerCallbackQuery();
    // Удаляем приветственное сообщение с кнопками
    const greetingId = (ctx as any).session?.greetingMessageId;
    if (greetingId) {
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, greetingId);
      } catch {}
    }
    await ctx.conversation.enter("creatorConversation");
  });

  bot.callbackQuery("role:company", async (ctx) => {
    await ctx.answerCallbackQuery();
    const greetingId = (ctx as any).session?.greetingMessageId;
    if (greetingId) {
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, greetingId);
      } catch {}
    }
    await ctx.conversation.enter("companyConversation");
  });

  // Company refill callback
  bot.callbackQuery("company:refill", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("companyConversation");
  });

  // Browse creators callbacks
  bot.callbackQuery("browse:start", handleBrowseCreators);
  bot.callbackQuery(/^browse:nav:/, handleBrowseNav);
  bot.callbackQuery("browse:noop", (ctx) => ctx.answerCallbackQuery());

  // Moderation callbacks
  bot.callbackQuery(/^moderate:/, handleModeration);

  // Project response callbacks
  bot.callbackQuery(/^respond:/, handleProjectResponse);

  // Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}
