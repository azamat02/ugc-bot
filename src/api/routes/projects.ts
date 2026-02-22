import { Router, Response } from "express";
import { prisma } from "../../db/prisma";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    include: { company: true, _count: { select: { responses: true } } },
    orderBy: { createdAt: "desc" },
  });

  const result = projects.map((p) => ({
    ...p,
    company: {
      ...p.company,
      telegramId: p.company.telegramId.toString(),
    },
  }));

  res.json(result);
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const project = await prisma.project.findUnique({
    where: { id },
    include: { company: true },
  });

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({
    ...project,
    company: {
      ...project.company,
      telegramId: project.company.telegramId.toString(),
    },
  });
});

router.get("/:id/responses", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const responses = await prisma.projectResponse.findMany({
    where: { projectId: id },
    include: { creator: true },
    orderBy: { createdAt: "desc" },
  });

  const result = responses.map((r) => ({
    ...r,
    creator: {
      ...r.creator,
      telegramId: r.creator.telegramId.toString(),
    },
  }));

  res.json(result);
});

export default router;
