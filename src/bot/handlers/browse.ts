import { Context } from "grammy";
import { prisma } from "../../db/prisma";
import { browseCreatorsKeyboard } from "../keyboards";

const skillLabels: Record<string, string> = {
  pro: "Профи",
  medium: "Средний",
  beginner: "Начинающий",
};

function creatorCaption(creator: any, index: number, total: number): string {
  return (
    `👤 Имя: ${creator.name}\n` +
    `🚻 Пол: ${creator.gender === "male" ? "Мужской" : "Женский"}\n` +
    `🎂 Возраст: ${creator.age}\n` +
    `🎬 Монтаж: ${skillLabels[creator.editingSkill] || creator.editingSkill}\n` +
    `💼 Опыт UGC: ${creator.hasExperience ? "Да" : "Нет"}\n` +
    (creator.instagram ? `📸 Instagram: instagram.com/${creator.instagram}\n` : "") +
    (creator.tiktok ? `🎵 TikTok: tiktok.com/@${creator.tiktok}\n` : "") +
    `\n📄 ${index + 1} / ${total}`
  );
}

export async function handleBrowseCreators(ctx: Context) {
  await ctx.answerCallbackQuery();

  const role = (ctx as any).userRole;
  const dbUser = (ctx as any).dbUser;

  if (role !== "company" || dbUser?.status !== "approved") {
    await ctx.reply("⛔ Просмотр доступен только одобренным компаниям.");
    return;
  }

  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (creators.length === 0) {
    await ctx.reply("😔 Пока нет зарегистрированных креаторов.");
    return;
  }

  const creator = creators[0];

  await ctx.replyWithPhoto(creator.photoFileId, {
    caption: creatorCaption(creator, 0, creators.length),
    reply_markup: browseCreatorsKeyboard(0, creators.length, creator.phone, creator.username),
  });
}

export async function handleBrowseNav(ctx: Context) {
  await ctx.answerCallbackQuery();

  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const offset = parseInt(data.split(":")[2], 10);

  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (creators.length === 0) return;

  const index = ((offset % creators.length) + creators.length) % creators.length;
  const creator = creators[index];

  try {
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: creator.photoFileId,
        caption: creatorCaption(creator, index, creators.length),
      },
      {
        reply_markup: browseCreatorsKeyboard(index, creators.length, creator.phone, creator.username),
      }
    );
  } catch (err) {
    console.error("Failed to edit message media:", err);
  }
}
