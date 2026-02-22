import { Router, Response } from "express";
import multer from "multer";
import { InputFile } from "grammy";
import { prisma } from "../../db/prisma";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { resolveRecipients, executeBroadcast } from "../../bot/broadcast";
import { telegramApi } from "../../bot/telegramApi";

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// GET /api/broadcasts — list
router.get("/", async (req: AuthRequest, res: Response) => {
  const { status, audience, search } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status as string;
  if (audience) where.targetAudience = audience as string;
  if (search) {
    where.text = { contains: search as string, mode: "insensitive" };
  }

  const broadcasts = await prisma.broadcast.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { admin: { select: { username: true } } },
  });

  res.json(broadcasts);
});

// GET /api/broadcasts/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const broadcast = await prisma.broadcast.findUnique({
    where: { id },
    include: { admin: { select: { username: true } } },
  });

  if (!broadcast) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  res.json(broadcast);
});

// POST /api/broadcasts — create draft
router.post("/", async (req: AuthRequest, res: Response) => {
  const {
    text,
    targetAudience,
    filterGender,
    filterEditingSkill,
    filterHasExperience,
    filterNiche,
    filterStatus,
  } = req.body;

  const broadcast = await prisma.broadcast.create({
    data: {
      text: text || "",
      targetAudience: targetAudience || "all",
      filterGender: filterGender || null,
      filterEditingSkill: filterEditingSkill || null,
      filterHasExperience:
        filterHasExperience !== undefined ? filterHasExperience : null,
      filterNiche: filterNiche || null,
      filterStatus: filterStatus || null,
      createdBy: req.adminId!,
    },
  });

  res.json(broadcast);
});

// PUT /api/broadcasts/:id — update draft/scheduled
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const existing = await prisma.broadcast.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  if (existing.status !== "draft" && existing.status !== "scheduled") {
    res.status(400).json({ error: "Can only edit draft or scheduled broadcasts" });
    return;
  }

  const {
    text,
    targetAudience,
    filterGender,
    filterEditingSkill,
    filterHasExperience,
    filterNiche,
    filterStatus,
  } = req.body;

  const broadcast = await prisma.broadcast.update({
    where: { id },
    data: {
      text,
      targetAudience,
      filterGender: filterGender || null,
      filterEditingSkill: filterEditingSkill || null,
      filterHasExperience:
        filterHasExperience !== undefined ? filterHasExperience : null,
      filterNiche: filterNiche || null,
      filterStatus: filterStatus || null,
    },
  });

  res.json(broadcast);
});

// POST /api/broadcasts/:id/upload — upload media
router.post(
  "/:id/upload",
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const broadcast = await prisma.broadcast.findUnique({ where: { id } });

    if (!broadcast) {
      res.status(404).json({ error: "Broadcast not found" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const mediaType = isVideo ? "video" : "photo";

    try {
      const inputFile = new InputFile(req.file.buffer, req.file.originalname);

      let fileId: string;
      let sentMsgId: number;

      if (isVideo) {
        const msg = await telegramApi.sendVideo(ADMIN_CHAT_ID, inputFile);
        fileId = msg.video!.file_id;
        sentMsgId = msg.message_id;
      } else {
        const msg = await telegramApi.sendPhoto(ADMIN_CHAT_ID, inputFile);
        // largest photo size is last
        const photos = msg.photo!;
        fileId = photos[photos.length - 1].file_id;
        sentMsgId = msg.message_id;
      }

      // Delete the temporary message from admin chat
      try {
        await telegramApi.deleteMessage(ADMIN_CHAT_ID, sentMsgId);
      } catch {
        // ignore deletion errors
      }

      const updated = await prisma.broadcast.update({
        where: { id },
        data: { mediaFileId: fileId, mediaType },
      });

      res.json(updated);
    } catch (err) {
      console.error("Media upload error:", err);
      res.status(500).json({ error: "Failed to upload media" });
    }
  }
);

// POST /api/broadcasts/:id/send — send or schedule
router.post("/:id/send", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const broadcast = await prisma.broadcast.findUnique({ where: { id } });

  if (!broadcast) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  if (broadcast.status !== "draft" && broadcast.status !== "scheduled") {
    res.status(400).json({ error: "Broadcast already sent or sending" });
    return;
  }

  const { scheduledAt } = req.body;

  if (scheduledAt) {
    const updated = await prisma.broadcast.update({
      where: { id },
      data: {
        status: "scheduled",
        scheduledAt: new Date(scheduledAt),
      },
    });
    res.json(updated);
    return;
  }

  // Send immediately
  const recipients = await resolveRecipients(broadcast);
  await prisma.broadcast.update({
    where: { id },
    data: { totalRecipients: recipients.length },
  });

  res.json({ ...broadcast, status: "sending", totalRecipients: recipients.length });

  // Execute in background
  executeBroadcast(id).catch((err) => {
    console.error(`Failed to execute broadcast ${id}:`, err);
  });
});

// POST /api/broadcasts/:id/preview-count — recipient count
router.post("/:id/preview-count", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const broadcast = await prisma.broadcast.findUnique({ where: { id } });

  if (!broadcast) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  const recipients = await resolveRecipients(broadcast);
  res.json({ count: recipients.length });
});

// DELETE /api/broadcasts/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const broadcast = await prisma.broadcast.findUnique({ where: { id } });

  if (!broadcast) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  if (broadcast.status !== "draft" && broadcast.status !== "scheduled") {
    res.status(400).json({ error: "Can only delete draft or scheduled broadcasts" });
    return;
  }

  await prisma.broadcast.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
