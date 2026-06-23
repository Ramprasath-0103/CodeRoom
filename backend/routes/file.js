// routes/file.js

import express from "express";
import crypto from "crypto";
import prisma from "../src/prisma.js";

const router = express.Router();

router.post("/:workspaceId/file", async (req, res) => {
  const { workspaceId } = req.params;
  const { name } = req.body;

  const file = await prisma.file.create({
    data: {
      id: crypto.randomUUID(),
      name,
      content: "",
      workspaceId,
    },
  });

  res.status(201).json(file);
});

export default router;