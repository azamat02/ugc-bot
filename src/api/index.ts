import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import creatorsRoutes from "./routes/creators";
import companiesRoutes from "./routes/companies";
import projectsRoutes from "./routes/projects";
import photoRoutes from "./routes/photo";
import broadcastsRoutes from "./routes/broadcasts";

export function createApi() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/creators", creatorsRoutes);
  app.use("/api/companies", companiesRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/photo", photoRoutes);
  app.use("/api/broadcasts", broadcastsRoutes);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
