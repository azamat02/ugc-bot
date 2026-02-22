import { Router, Response } from "express";
import { prisma } from "../../db/prisma";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  const status = req.query.status as string | undefined;

  const companies = await prisma.company.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });

  const result = companies.map((c) => ({
    ...c,
    telegramId: c.telegramId.toString(),
  }));

  res.json(result);
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const company = await prisma.company.findUnique({
    where: { id },
    include: { projects: true },
  });

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json({
    ...company,
    telegramId: company.telegramId.toString(),
  });
});

router.patch("/:id/moderate", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    return;
  }

  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const updated = await prisma.company.update({
    where: { id },
    data: { status },
  });

  res.json({
    ...updated,
    telegramId: updated.telegramId.toString(),
  });
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  // Удаляем отклики → проекты → компанию
  await prisma.projectResponse.deleteMany({
    where: { project: { companyId: id } },
  });
  await prisma.project.deleteMany({ where: { companyId: id } });
  await prisma.company.delete({ where: { id } });

  res.json({ ok: true });
});

export default router;
