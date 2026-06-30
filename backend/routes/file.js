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
    language: "javascript",
    workspaceId,
},
  });

  res.status(201).json(file);
});

router.patch("/:id/content", async (req, res) => {
  const { content } = req.body;

  try {
    const file = await prisma.file.update({
      where: {
        id: req.params.id,
      },
      data: {
        content,
      },
    });

    res.json(file);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update content",
    });
  }
});

router.patch("/file/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const { name } = req.body;

  const updatedFile = await prisma.file.update({
    where: {
      id: fileId,
    },
    data: {
      name,
    },
  });

  res.json(updatedFile);
});

router.patch("/:id/language", async (req, res) => {
  const { language } = req.body;

  try {
    const file = await prisma.file.update({
      where: {
        id: req.params.id,
      },
      data: {
        language,
      },
    });

    res.json(file);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update language",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.file.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete file",
    });
  }
});



export default router;