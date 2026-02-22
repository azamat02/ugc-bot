import { prisma } from "../db/prisma";
import { telegramApi } from "./telegramApi";

interface RecipientFilters {
  targetAudience: string;
  filterGender?: string | null;
  filterEditingSkill?: string | null;
  filterHasExperience?: boolean | null;
  filterNiche?: string | null;
  filterStatus?: string | null;
}

export async function resolveRecipients(
  filters: RecipientFilters
): Promise<bigint[]> {
  const telegramIds: bigint[] = [];

  if (
    filters.targetAudience === "creators" ||
    filters.targetAudience === "all"
  ) {
    const where: Record<string, unknown> = {};
    if (filters.filterGender) where.gender = filters.filterGender;
    if (filters.filterEditingSkill)
      where.editingSkill = filters.filterEditingSkill;
    if (filters.filterHasExperience !== null && filters.filterHasExperience !== undefined)
      where.hasExperience = filters.filterHasExperience;

    const creators = await prisma.creator.findMany({
      where,
      select: { telegramId: true },
    });
    telegramIds.push(...creators.map((c) => c.telegramId));
  }

  if (
    filters.targetAudience === "companies" ||
    filters.targetAudience === "all"
  ) {
    const where: Record<string, unknown> = {};
    if (filters.filterNiche) where.niche = filters.filterNiche;
    if (filters.filterStatus) where.status = filters.filterStatus;

    const companies = await prisma.company.findMany({
      where,
      select: { telegramId: true },
    });
    telegramIds.push(...companies.map((c) => c.telegramId));
  }

  return telegramIds;
}

export async function executeBroadcast(broadcastId: number): Promise<void> {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
  });
  if (!broadcast) return;

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: "sending" },
  });

  const recipients = await resolveRecipients(broadcast);

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { totalRecipients: recipients.length },
  });

  let delivered = 0;
  let failed = 0;

  for (const telegramId of recipients) {
    try {
      const chatId = telegramId.toString();

      if (broadcast.mediaFileId && broadcast.mediaType === "photo") {
        await telegramApi.sendPhoto(chatId, broadcast.mediaFileId, {
          caption: broadcast.text,
          parse_mode: "HTML",
        });
      } else if (broadcast.mediaFileId && broadcast.mediaType === "video") {
        await telegramApi.sendVideo(chatId, broadcast.mediaFileId, {
          caption: broadcast.text,
          parse_mode: "HTML",
        });
      } else {
        await telegramApi.sendMessage(chatId, broadcast.text, {
          parse_mode: "HTML",
        });
      }

      delivered++;
    } catch (err) {
      console.error(
        `Broadcast ${broadcastId}: failed to send to ${telegramId}`,
        err
      );
      failed++;
    }

    // Update counters every 10 messages
    if ((delivered + failed) % 10 === 0) {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { deliveredCount: delivered, failedCount: failed },
      });
    }
  }

  // Final update
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      deliveredCount: delivered,
      failedCount: failed,
      status: failed === recipients.length && recipients.length > 0 ? "failed" : "sent",
      sentAt: new Date(),
    },
  });
}
