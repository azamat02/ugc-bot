import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context } from "grammy";
import {
  genderKeyboard,
  editingSkillKeyboard,
  experienceKeyboard,
  sharePhoneKeyboard,
  channelInviteKeyboard,
} from "../keyboards";
import { prisma } from "../../db/prisma";
import { notifyAdminsNewCreator } from "../../admin/telegram";
import { updateUserStep } from "../../db/userStep";

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

export async function creatorConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const chatId = ctx.chat!.id;
  const telegramUserId = ctx.from!.id;
  // Auto-get Telegram username
  const telegramNick = ctx.from!.username
    ? `@${ctx.from!.username}`
    : ctx.from!.first_name;
  const username = ctx.from!.username || null;

  // 1. Имя (step already set to creator:name when role was selected)
  const q1 = await ctx.reply("📝 Введите ваше имя:");
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message!.text;
  await deleteMessages(ctx, [q1.message_id, nameCtx.message!.message_id]);

  // 2. Пол
  await conversation.external(() => updateUserStep(telegramUserId, "creator:gender"));
  const q2 = await ctx.reply("👤 Выберите ваш пол:", {
    reply_markup: genderKeyboard,
  });
  const genderCtx = await conversation.waitForCallbackQuery(/^gender:/);
  const gender = genderCtx.callbackQuery.data.split(":")[1];
  await genderCtx.answerCallbackQuery();
  await deleteMessages(ctx, [q2.message_id]);

  // 3. Возраст
  await conversation.external(() => updateUserStep(telegramUserId, "creator:age"));
  const q3 = await ctx.reply("🎂 Введите ваш возраст:");
  let age: number;
  const ageTrash: number[] = [];
  while (true) {
    const ageCtx = await conversation.waitFor("message:text");
    const parsed = parseInt(ageCtx.message!.text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 100) {
      age = parsed;
      ageTrash.push(ageCtx.message!.message_id);
      break;
    }
    ageTrash.push(ageCtx.message!.message_id);
    const errMsg = await ctx.reply(
      "❌ Введите корректный возраст (число от 1 до 99):"
    );
    ageTrash.push(errMsg.message_id);
  }
  await deleteMessages(ctx, [q3.message_id, ...ageTrash]);

  // 4. Город
  await conversation.external(() => updateUserStep(telegramUserId, "creator:city"));
  const q3c = await ctx.reply("📍 Из какого вы города?");
  const cityCtx = await conversation.waitFor("message:text");
  const city = cityCtx.message!.text.trim();
  await deleteMessages(ctx, [q3c.message_id, cityCtx.message!.message_id]);

  // 5. Телефон (через нативную кнопку "Поделиться контактом")
  await conversation.external(() => updateUserStep(telegramUserId, "creator:phone"));
  const q4 = await ctx.reply(
    "📱 Поделитесь вашим номером телефона (WhatsApp):",
    { reply_markup: sharePhoneKeyboard }
  );
  const phoneCtx = await conversation.waitFor("message:contact");
  const phone = phoneCtx.message!.contact!.phone_number;
  await deleteMessages(ctx, [q4.message_id, phoneCtx.message!.message_id]);
  // Убираем кастомную клавиатуру
  const removeKb = await ctx.reply("✓", {
    reply_markup: { remove_keyboard: true },
  });
  await deleteMessages(ctx, [removeKb.message_id]);

  // 6. Instagram
  await conversation.external(() => updateUserStep(telegramUserId, "creator:instagram"));
  const q5 = await ctx.reply(
    "📸 Введите ваш никнейм в Instagram:\n\nНапример: daniya_yess"
  );
  const igCtx = await conversation.waitFor("message:text");
  const instagram = igCtx.message!.text.trim().replace(/^@/, "");
  await deleteMessages(ctx, [q5.message_id, igCtx.message!.message_id]);

  // 7. TikTok
  await conversation.external(() => updateUserStep(telegramUserId, "creator:tiktok"));
  const q6 = await ctx.reply(
    "🎵 Введите ваш никнейм в TikTok:\n\nНапример: daniya_yess"
  );
  const ttCtx = await conversation.waitFor("message:text");
  const tiktok = ttCtx.message!.text.trim().replace(/^@/, "");
  await deleteMessages(ctx, [q6.message_id, ttCtx.message!.message_id]);

  // 8. Фото
  await conversation.external(() => updateUserStep(telegramUserId, "creator:photo"));
  const q7 = await ctx.reply("📷 Отправьте ваше фото:\n\n⚠️ Отправьте фото где хорошо видно ваше лицо");
  const photoCtx = await conversation.waitFor("message:photo");
  const photoFileId =
    photoCtx.message!.photo![photoCtx.message!.photo!.length - 1].file_id;
  await deleteMessages(ctx, [q7.message_id, photoCtx.message!.message_id]);

  // 9. Навыки монтажа
  await conversation.external(() => updateUserStep(telegramUserId, "creator:editing_skill"));
  const q8 = await ctx.reply("🎬 Ваш уровень навыков монтажа:", {
    reply_markup: editingSkillKeyboard,
  });
  const skillCtx = await conversation.waitForCallbackQuery(/^skill:/);
  const editingSkill = skillCtx.callbackQuery.data.split(":")[1];
  await skillCtx.answerCallbackQuery();
  await deleteMessages(ctx, [q8.message_id]);

  // 10. Опыт UGC
  await conversation.external(() => updateUserStep(telegramUserId, "creator:experience"));
  const q9 = await ctx.reply("💼 Есть ли у вас опыт в UGC?", {
    reply_markup: experienceKeyboard,
  });
  const expCtx = await conversation.waitForCallbackQuery(/^exp:/);
  const hasExperience = expCtx.callbackQuery.data.split(":")[1] === "yes";
  await expCtx.answerCallbackQuery();
  await deleteMessages(ctx, [q9.message_id]);

  // Сохранение в БД
  const creator = await prisma.creator.create({
    data: {
      telegramId: BigInt(ctx.from!.id),
      username,
      name,
      gender,
      age,
      city,
      phone,
      telegramNick,
      instagram,
      tiktok,
      photoFileId,
      editingSkill,
      hasExperience,
    },
  });

  await conversation.external(() => updateUserStep(telegramUserId, "completed"));

  await ctx.reply(
    "✅ Спасибо! Приняли вашу анкету.\n\n" +
      "Мы уведомим вас, когда появятся подходящие проекты от компаний. Оставайтесь на связи! 🚀"
  );

  // Генерируем инвайт-ссылку в канал для креаторов — отдельным сообщением с кнопкой
  const creatorsChannelId = process.env.CREATORS_CHAT_ID;
  if (creatorsChannelId) {
    try {
      const invite = await ctx.api.createChatInviteLink(creatorsChannelId, {
        member_limit: 1,
        name: `creator_${ctx.from!.id}`,
      });
      await ctx.reply(
        "🔗 Присоединяйтесь к нашему каналу для креаторов:",
        { reply_markup: channelInviteKeyboard(invite.invite_link) }
      );
    } catch (err) {
      console.error("Failed to create invite link:", err);
    }
  }

  // Уведомление админов о новом креаторе
  await notifyAdminsNewCreator(ctx.api, creator);
}
