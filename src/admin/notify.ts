import { Api } from "grammy";
import { Company, Project } from "@prisma/client";
import { prisma } from "../db/prisma";
import { respondKeyboard } from "../bot/keyboards";

export async function notifyCreatorsAboutProject(
  api: Api,
  project: Project,
  company: Company
) {
  const creators = await prisma.creator.findMany();

  const message =
    `🔥 Новый проект!\n\n` +
    `🏢 Компания: ${company.companyName}\n` +
    `📂 Ниша: ${company.niche}\n\n` +
    `📋 ${project.title}\n` +
    `${project.description}\n\n` +
    `Нажмите кнопку ниже, чтобы откликнуться:`;

  for (const creator of creators) {
    try {
      await api.sendMessage(creator.telegramId.toString(), message, {
        reply_markup: respondKeyboard(project.id),
      });
    } catch (err) {
      console.error(
        `Failed to notify creator ${creator.id} (${creator.telegramId}):`,
        err
      );
    }
  }

  console.log(`Notified ${creators.length} creators about project ${project.id}`);
}
