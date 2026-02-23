import { Context } from "grammy";
import { roleKeyboard, companyMenuKeyboard } from "../keyboards";
import { upsertUser } from "../../db/userStep";

export function getCompanyMenuMessage(status: string) {
  if (status === "approved") {
    return "👋 Добро пожаловать! Ваша компания одобрена.";
  } else if (status === "rejected") {
    return "😔 Ваша заявка отклонена. Вы можете заполнить анкету заново.";
  }
  return "⏳ Ваша заявка на модерации. Мы уведомим вас о результате.";
}

export async function handleStart(ctx: Context) {
  const registered = (ctx as any).isRegistered;

  // Удаляем команду /start от пользователя
  if (ctx.message?.message_id) {
    try {
      await ctx.api.deleteMessage(ctx.chat!.id, ctx.message.message_id);
    } catch {}
  }

  // Трекинг пользователя с момента /start
  const telegramId = ctx.from!.id;
  const username = ctx.from!.username || null;
  const firstName = ctx.from!.first_name || null;

  if (registered) {
    const role = (ctx as any).userRole;
    const dbUser = (ctx as any).dbUser;

    await upsertUser(telegramId, { username, firstName, registrationStep: "completed", role });

    if (role === "creator") {
      await ctx.reply(
        "👋 Вы уже зарегистрированы как UGC-креатор!\n\nМы уведомим вас о новых проектах."
      );
    } else if (role === "company") {
      await ctx.reply(getCompanyMenuMessage(dbUser.status), {
        reply_markup: companyMenuKeyboard(dbUser.status),
      });
    }
    return;
  }

  await upsertUser(telegramId, { username, firstName, registrationStep: "started" });

  await ctx.reply(
    "Привет!\n\n" +
    "Этот телеграмм бот для UGC-креаторов и компаний.\n\n" +
    "✅ Здесь можно найти вакансии на UGC-контент.\n\n" +
    "UGC (user generated content) - контент, который создают юзеры. " +
    "Это обычные пользователи, которые снимают обзоры на продукты компаний " +
    "(косметику, одежду, бытовую технику). Для этого не нужно иметь много подписчиков, " +
    "достаточно иметь телефон, доступ в интернет и снимать качественный контент. " +
    "Компании платят за твой контент, а не за твоих подписчиков."
  );

  await ctx.reply(
    "После регистрации, бот предложит тебе подписаться на канал, " +
    "где есть много полезной информации о том как создавать качественный ugc-контент ❤️"
  );

  const buttons = await ctx.reply("Выберите вашу роль:", {
    reply_markup: roleKeyboard,
  });

  await upsertUser(telegramId, { registrationStep: "choosing_role" });

  // Сохраняем ID сообщения с кнопками чтобы удалить при выборе роли
  (ctx as any).session = (ctx as any).session || {};
  (ctx as any).session.greetingMessageId = buttons.message_id;
}
