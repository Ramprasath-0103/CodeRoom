import { Router } from "express";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { createWorkspace, getWorkspace } from "./workspaceService.js";

export function createWorkspaceRouter() {
  const router = Router();

  const creationLimiter = createRateLimiter({
    limit: 20,
    message: "Too many workspaces created, please wait a minute",
  });

  router.post("/", creationLimiter, async (req, res) => {
    const workspace = await createWorkspace();
    res.status(201).json(workspace);
  });

  router.get("/:workspaceId", async (req, res) => {
    const workspace = await getWorkspace(req.params.workspaceId);
    res.json(workspace);
  });

  return router;
}
