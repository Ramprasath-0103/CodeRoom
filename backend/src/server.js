import http from "node:http";
import { createApp } from "./app.js";
import { attachCollaboration } from "./collaboration/attachCollaboration.js";
import { persistOpenDocuments } from "./collaboration/collaborationServer.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prismaClient.js";

const httpServer = http.createServer(createApp());

attachCollaboration(httpServer);

httpServer.listen(env.port, () => {
  console.log(`CodeRoom backend listening on port ${env.port}`);
});

let isShuttingDown = false;

async function shutDown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received, saving open documents`);
  httpServer.close();

  const { saved, failed } = await persistOpenDocuments();
  console.log(`Saved ${saved} open documents, ${failed} failed`);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

process.on("SIGTERM", () => shutDown("SIGTERM"));
process.on("SIGINT", () => shutDown("SIGINT"));
