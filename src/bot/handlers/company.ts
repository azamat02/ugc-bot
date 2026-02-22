import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context } from "grammy";
import { nicheKeyboard } from "../keyboards";
import { prisma } from "../../db/prisma";
import { notifyAdminsNewCompany } from "../../admin/telegram";

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

async function deleteMessages(ctx: MyContext, messageIds: number[]) {
  for (const id of messageIds) {
    try {
      await ctx.api.deleteMessage(ctx.chat!.id, id);
    } catch {
      // Message may already be deleted or too old
    }
  }
}

export async function companyConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  // 1. Название компании
  const q1 = await ctx.reply("🏢 Введите название вашей компании:");
  const nameCtx = await conversation.waitFor("message:text");
  const companyName = nameCtx.message!.text;
  await deleteMessages(ctx, [q1.message_id, nameCtx.message!.message_id]);

  // 2. Ниша
  const q2 = await ctx.reply("📂 Выберите нишу вашей компании:", {
    reply_markup: nicheKeyboard,
  });
  const nicheCtx = await conversation.waitForCallbackQuery(/^niche:/);
  const niche = nicheCtx.callbackQuery.data.split(":")[1];
  await nicheCtx.answerCallbackQuery();
  await deleteMessages(ctx, [q2.message_id]);

  // 3. Описание продукта
  const q3 = await ctx.reply("📦 Опишите ваш продукт/услугу:");
  const descCtx = await conversation.waitFor("message:text");
  const productDesc = descCtx.message!.text;
  await deleteMessages(ctx, [q3.message_id, descCtx.message!.message_id]);

  // 4. Ссылки на соцсети
  const q4 = await ctx.reply("🔗 Отправьте ссылку на ваш сайт или другие соцсети:");
  const linksCtx = await conversation.waitFor("message:text");
  const socialLinks = linksCtx.message!.text;
  await deleteMessages(ctx, [q4.message_id, linksCtx.message!.message_id]);

  // 5. Instagram
  const q5ig = await ctx.reply(
    "📸 Введите никнейм компании в Instagram:\n\nНапример: daniya_yess"
  );
  const igCtx = await conversation.waitFor("message:text");
  const instagram = igCtx.message!.text.trim().replace(/^@/, "");
  await deleteMessages(ctx, [q5ig.message_id, igCtx.message!.message_id]);

  // 6. TikTok
  const q6tt = await ctx.reply(
    "🎵 Введите никнейм компании в TikTok:\n\nНапример: daniya_yess"
  );
  const ttCtx = await conversation.waitFor("message:text");
  const tiktok = ttCtx.message!.text.trim().replace(/^@/, "");
  await deleteMessages(ctx, [q6tt.message_id, ttCtx.message!.message_id]);

  // 7. Требования к креаторам
  const q7 = await ctx.reply("📋 Какие требования к UGC-креаторам?");
  const reqsCtx = await conversation.waitFor("message:text");
  const creatorReqs = reqsCtx.message!.text;
  await deleteMessages(ctx, [q7.message_id, reqsCtx.message!.message_id]);

  // 8. Условия сотрудничества
  const q8 = await ctx.reply(
    "💰 Опишите условия сотрудничества (бюджет, формат, сроки):"
  );
  const condCtx = await conversation.waitFor("message:text");
  const conditions = condCtx.message!.text;
  await deleteMessages(ctx, [q8.message_id, condCtx.message!.message_id]);

  // 9. Критерии успеха
  const q9 = await ctx.reply("🎯 Какие критерии успеха проекта?");
  const criteriaCtx = await conversation.waitFor("message:text");
  const successCriteria = criteriaCtx.message!.text;
  await deleteMessages(ctx, [q9.message_id, criteriaCtx.message!.message_id]);

  // Сохранение в БД (upsert для поддержки повторного заполнения)
  const telegramId = BigInt(ctx.from!.id);
  const companyData = {
    companyName,
    niche,
    productDesc,
    socialLinks,
    instagram,
    tiktok,
    creatorReqs,
    conditions,
    successCriteria,
    status: "pending",
  };
  const company = await prisma.company.upsert({
    where: { telegramId },
    create: { telegramId, ...companyData },
    update: companyData,
  });

  await ctx.reply(
    "✅ Спасибо! Ваша заявка отправлена на модерацию.\n\n" +
      "Мы уведомим вас о результате проверки. Это обычно занимает до 24 часов. ⏳"
  );

  // Уведомление в админ-чат
  await notifyAdminsNewCompany(ctx.api, company);
}
