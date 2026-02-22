import { Router, Response } from "express";
import { prisma } from "../../db/prisma";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Convert BigInt to string for JSON serialization
  const result = creators.map((c) => ({
    ...c,
    telegramId: c.telegramId.toString(),
  }));

  res.json(result);
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const creator = await prisma.creator.findUnique({
    where: { id },
    include: { responses: { include: { project: true } } },
  });

  if (!creator) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  res.json({
    ...creator,
    telegramId: creator.telegramId.toString(),
  });
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const creator = await prisma.creator.findUnique({ where: { id } });

  if (!creator) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  // Удаляем связанные отклики, затем креатора
  await prisma.projectResponse.deleteMany({ where: { creatorId: id } });
  await prisma.creator.delete({ where: { id } });

  res.json({ ok: true });
});

export default router;
