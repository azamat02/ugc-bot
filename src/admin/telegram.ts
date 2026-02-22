import { Api, Context } from "grammy";
import { Company, Creator } from "@prisma/client";
import { prisma } from "../db/prisma";
import { moderationKeyboard, creatorContactKeyboard, viewCreatorsKeyboard } from "../bot/keyboards";
import { notifyCreatorsAboutProject } from "./notify";

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";

const skillLabels: Record<string, string> = {
  pro: "Профи",
  medium: "Средний",
  beginner: "Начинающий",
};

export async function notifyAdminsNewCreator(api: Api, creator: Creator) {
  if (!ADMIN_CHAT_ID) return;

  const message =
    `🆕 Новый креатор зарегистрировался!\n\n` +
    `👤 Имя: ${creator.name}\n` +
    `🚻 Пол: ${creator.gender === "male" ? "Мужской" : "Женский"}\n` +
    `🎂 Возраст: ${creator.age}\n` +
    `📱 WhatsApp: ${creator.phone}\n` +
    `✈️ Telegram: ${creator.telegramNick}\n` +
    (creator.instagram ? `📸 Instagram: instagram.com/${creator.instagram}\n` : "") +
    (creator.tiktok ? `🎵 TikTok: tiktok.com/@${creator.tiktok}\n` : "") +
    `🎬 Монтаж: ${skillLabels[creator.editingSkill] || creator.editingSkill}\n` +
    `💼 Опыт UGC: ${creator.hasExperience ? "Да" : "Нет"}`;

  // Отправляем фото с текстом и кнопками для связи
  try {
    await api.sendPhoto(ADMIN_CHAT_ID, creator.photoFileId, {
      caption: message,
      reply_markup: creatorContactKeyboard(creator.phone, creator.username),
    });
  } catch (err) {
    // Если фото не удалось — шлём текстом
    console.error("Failed to send photo to admin chat:", err);
    await api.sendMessage(ADMIN_CHAT_ID, message, {
      reply_markup: creatorContactKeyboard(creator.phone, creator.username),
    });
  }
}

export async function notifyAdminsNewCompany(api: Api, company: Company) {
  if (!ADMIN_CHAT_ID) {
    console.warn("ADMIN_CHAT_ID not set, skipping admin notification");
    return;
  }

  const message =
    `🆕 Новая заявка от компании!\n\n` +
    `🏢 Название: ${company.companyName}\n` +
    `📂 Ниша: ${company.niche}\n` +
    `📦 Продукт: ${company.productDesc}\n` +
    `🔗 Соцсети: ${company.socialLinks}\n` +
    (company.instagram ? `📸 Instagram: instagram.com/${company.instagram}\n` : "") +
    (company.tiktok ? `🎵 TikTok: tiktok.com/@${company.tiktok}\n` : "") +
    `📋 Требования: ${company.creatorReqs}\n` +
    `💰 Условия: ${company.conditions}\n` +
    `🎯 Критерии: ${company.successCriteria}`;

  await api.sendMessage(ADMIN_CHAT_ID, message, {
    reply_markup: moderationKeyboard(company.id),
  });
}

export async function handleModeration(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const parts = data.split(":");
  const action = parts[1];
  const companyId = parseInt(parts[2], 10);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    await ctx.answerCallbackQuery({ text: "Компания не найдена" });
    return;
  }

  if (company.status !== "pending") {
    await ctx.answerCallbackQuery({ text: "Заявка уже обработана" });
    return;
  }

  if (action === "approve") {
    await prisma.company.update({
      where: { id: companyId },
      data: { status: "approved" },
    });

    const project = await prisma.project.create({
      data: {
        companyId,
        title: `Проект от ${company.companyName}`,
        description:
          `${company.productDesc}\n\n` +
          `Требования: ${company.creatorReqs}\n` +
          `Условия: ${company.conditions}`,
        status: "active",
      },
    });

    await ctx.api.sendMessage(
      company.telegramId.toString(),
      "🎉 Ваша заявка одобрена! Вы можете просмотреть анкеты креаторов.",
      { reply_markup: viewCreatorsKeyboard() }
    );

    await notifyCreatorsAboutProject(ctx.api, project, company);

    await ctx.answerCallbackQuery({ text: "✅ Компания одобрена" });
    await ctx.editMessageText(
      ctx.callbackQuery!.message!.text + "\n\n✅ ОДОБРЕНО"
    );
  } else {
    await prisma.company.update({
      where: { id: companyId },
      data: { status: "rejected" },
    });

    await ctx.api.sendMessage(
      company.telegramId.toString(),
      "😔 К сожалению, ваша заявка не прошла модерацию. Свяжитесь с нами для уточнения деталей."
    );

    await ctx.answerCallbackQuery({ text: "❌ Компания отклонена" });
    await ctx.editMessageText(
      ctx.callbackQuery!.message!.text + "\n\n❌ ОТКЛОНЕНО"
    );
  }
}

export async function handleProjectResponse(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !ctx.from) return;

  const projectId = parseInt(data.split(":")[1], 10);

  const creator = await prisma.creator.findUnique({
    where: { telegramId: BigInt(ctx.from.id) },
  });

  if (!creator) {
    await ctx.answerCallbackQuery({
      text: "Вы не зарегистрированы как креатор",
    });
    return;
  }

  const existing = await prisma.projectResponse.findFirst({
    where: { projectId, creatorId: creator.id },
  });

  if (existing) {
    await ctx.answerCallbackQuery({
      text: "Вы уже откликнулись на этот проект",
    });
    return;
  }

  await prisma.projectResponse.create({
    data: {
      projectId,
      creatorId: creator.id,
      status: "pending",
    },
  });

  await ctx.answerCallbackQuery({ text: "✅ Ваш отклик отправлен!" });
  await ctx.reply(
    "📩 Ваш отклик на проект отправлен! Компания свяжется с вами в ближайшее время."
  );

  if (ADMIN_CHAT_ID) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { company: true },
    });

    await ctx.api.sendMessage(
      ADMIN_CHAT_ID,
      `📩 Новый отклик!\n\n` +
        `Креатор: ${creator.name} (@${creator.username || creator.telegramNick})\n` +
        `Проект: ${project?.title || projectId}\n` +
        `Компания: ${project?.company.companyName || "N/A"}`
    );
  }
}
