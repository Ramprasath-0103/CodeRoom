import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import prisma from "./prisma.js";

export const hocuspocusServer = new Server({
  port: 1234,

  async onLoadDocument({ document, documentName }) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: documentName },
    });

    if (workspace?.yjsState) {
      Y.applyUpdate(document, new Uint8Array(workspace.yjsState));
    }
  },

  async onStoreDocument({ document, documentName }) {
    const state = Buffer.from(Y.encodeStateAsUpdate(document));

    await prisma.workspace.update({
      where: { id: documentName },
      data: { yjsState: state },
    });
  },
});
