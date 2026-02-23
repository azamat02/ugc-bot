import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const username = await ask("Логин: ");
  const password = await ask("Пароль: ");

  if (!username || !password) {
    console.error("Логин и пароль обязательны");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`Админ "${admin.username}" создан (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
    prisma.$disconnect();
  });
