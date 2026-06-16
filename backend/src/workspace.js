import express from "express";
import { workspaces } from "./store.js";

const router = express.Router();

function generateWorkspaceId() {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

router.post("/", (req, res) => {
  const workspaceId = generateWorkspaceId();

  workspaces.set(workspaceId, {
    id: workspaceId,
    files: [
      {
        id: 1,
        name: "main.js",
        content: "",
      },
    ],
  });

  res.status(201).json({
    workspaceId,
  });
});

router.get("/:id", (req, res) => {
  const workspace = workspaces.get(req.params.id);

  if (!workspace) {
    return res.status(404).json({
      message: "Workspace not found",
    });
  }

  res.json(workspace);
});

export default router;