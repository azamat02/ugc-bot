import { InlineKeyboard, Keyboard } from "grammy";

export const roleKeyboard = new InlineKeyboard()
  .text("🎬 Я UGC-креатор", "role:creator").success()
  .row()
  .text("🏢 Я компания", "role:company").primary();

export const genderKeyboard = new InlineKeyboard()
  .text("👨 Мужской", "gender:male")
  .text("👩 Женский", "gender:female");

export const editingSkillKeyboard = new InlineKeyboard()
  .text("🎯 Профи", "skill:pro").success()
  .row()
  .text("📈 Средний", "skill:medium").primary()
  .row()
  .text("🌱 Начинающий", "skill:beginner").danger();

export const experienceKeyboard = new InlineKeyboard()
  .text("✅ Да", "exp:yes").success()
  .text("❌ Нет", "exp:no").danger();

export const nicheKeyboard = new InlineKeyboard()
  .text("🔌 Бытовая техника", "niche:бытовая_техника").primary()
  .row()
  .text("💄 Уходовая косметика", "niche:уходовая_косметика").danger()
  .row()
  .text("👗 Одежда и аксессуары", "niche:одежда_и_аксессуары").primary()
  .row()
  .text("🍔 Еда и напитки", "niche:еда_и_напитки").success()
  .row()
  .text("💻 IT и технологии", "niche:it_и_технологии").primary()
  .row()
  .text("📦 Другое", "niche:другое").danger();

export const sharePhoneKeyboard = new Keyboard()
  .requestContact("📱 Поделиться номером")
  .resized()
  .oneTime();

export function moderationKeyboard(companyId: number) {
  return new InlineKeyboard()
    .text("✅ Одобрить", `moderate:approve:${companyId}`).success()
    .text("❌ Отклонить", `moderate:reject:${companyId}`).danger();
}

export function respondKeyboard(projectId: number) {
  return new InlineKeyboard()
    .text("📩 Откликнуться", `respond:${projectId}`).success();
}

export function channelInviteKeyboard(inviteLink: string) {
  return new InlineKeyboard()
    .url("🔗 Войти в канал креаторов", inviteLink).success();
}

export function viewCreatorsKeyboard() {
  return new InlineKeyboard()
    .text("👥 Смотреть креаторов", "browse:start").primary();
}

export function companyMenuKeyboard(status: string) {
  const kb = new InlineKeyboard();
  if (status === "approved") {
    kb.text("👥 Смотреть креаторов", "browse:start").primary()
      .row()
      .text("📝 Заполнить заново", "company:refill");
  } else {
    kb.text("📝 Заполнить заново", "company:refill");
  }
  return kb;
}

export function browseCreatorsKeyboard(
  offset: number,
  total: number,
  phone: string,
  username: string | null
) {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    digits = "7" + digits.slice(1);
  }

  const kb = new InlineKeyboard()
    .text("◀️", `browse:nav:${(offset - 1 + total) % total}`)
    .text(`${offset + 1} / ${total}`, "browse:noop")
    .text("▶️", `browse:nav:${(offset + 1) % total}`)
    .row()
    .url("💬 WhatsApp", `https://wa.me/${digits}`).success();

  if (username) {
    kb.url("✈️ Telegram", `https://t.me/${username}`).primary();
  }

  return kb;
}

export function creatorContactKeyboard(phone: string, username: string | null) {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    digits = "7" + digits.slice(1);
  }
  const kb = new InlineKeyboard()
    .url("💬 WhatsApp", `https://wa.me/${digits}`).success();

  if (username) {
    kb.url("✈️ Telegram", `https://t.me/${username}`).primary();
  }

  return kb;
}
