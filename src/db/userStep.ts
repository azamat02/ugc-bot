import { prisma } from "./prisma";

export async function upsertUser(
  telegramId: number,
  data: { username?: string | null; firstName?: string | null; registrationStep?: string; role?: string | null }
) {
  return prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    create: {
      telegramId: BigInt(telegramId),
      username: data.username ?? null,
      firstName: data.firstName ?? null,
      registrationStep: data.registrationStep ?? "started",
      role: data.role ?? null,
    },
    update: {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.registrationStep !== undefined && { registrationStep: data.registrationStep }),
      ...(data.role !== undefined && { role: data.role }),
    },
  });
}

export async function updateUserStep(telegramId: number, step: string) {
  return prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { registrationStep: step },
  });
}
