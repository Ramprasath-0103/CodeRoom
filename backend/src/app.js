import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";
import { createExecutionRouter } from "./execution/executionRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { createWorkspaceRouter } from "./workspaces/workspaceRoutes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/workspaces", createWorkspaceRouter());
  app.use("/api/execute", createExecutionRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
