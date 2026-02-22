import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

const router = Router();

// Auth через query-параметр ?token= (для <img src="">)
router.get("/:fileId", async (req: Request, res: Response) => {
  const token =
    req.query.token as string | undefined;

  if (!token) {
    res.status(401).json({ error: "Token required (?token=...)" });
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const { fileId } = req.params;

  try {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileData = (await fileRes.json()) as {
      ok: boolean;
      result?: { file_path: string };
    };

    if (!fileData.ok || !fileData.result?.file_path) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const imageRes = await fetch(
      `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`
    );

    if (!imageRes.ok) {
      res.status(502).json({ error: "Failed to fetch image" });
      return;
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = Buffer.from(await imageRes.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("Photo proxy error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
