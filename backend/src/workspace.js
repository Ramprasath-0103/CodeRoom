import express from "express";
import crypto from "crypto";
import prisma from "./prisma.js";

const router = express.Router();

function generateWorkspaceId() {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

router.post("/", async (req, res) => {
  try {
    const workspaceId = generateWorkspaceId();

    await prisma.workspace.create({
      data: {
        id: workspaceId,
        files: {
          create: [
            {
              id: crypto.randomUUID(),
              name: "main.js",
              content: "",
            },
          ],
        },
      },
    });

    res.status(201).json({
      workspaceId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create workspace",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const workspace =
      await prisma.workspace.findUnique({
        where: {
          id: req.params.id,
        },
        include: {
          files: true,
        },
      });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load workspace",
    });
  }
});



export default router;