import { Context, NextFunction } from "grammy";
import { prisma } from "../../db/prisma";

export async function checkRegistered(ctx: Context, next: NextFunction) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);

  const creator = await prisma.creator.findUnique({
    where: { telegramId },
  });
  const company = await prisma.company.findUnique({
    where: { telegramId },
  });

  (ctx as any).isRegistered = !!(creator || company);
  (ctx as any).userRole = creator ? "creator" : company ? "company" : null;
  (ctx as any).dbUser = creator || company;

  await next();
}
