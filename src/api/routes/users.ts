import { Router, Response } from "express";
import { prisma } from "../../db/prisma";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  const { step } = req.query;

  const where = step ? { registrationStep: String(step) } : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const result = users.map((u) => ({
    ...u,
    telegramId: u.telegramId.toString(),
  }));

  res.json(result);
});

export default router;
