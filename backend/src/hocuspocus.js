import { Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";
import prisma from "./prisma.js";

// A bare Hocuspocus instance (no built-in server/port). It is attached to the
// shared HTTP server in index.js via `handleConnection`, so the whole backend
// runs on a single port — required by hosts like Render that expose only one.
export const hocuspocus = new Hocuspocus({
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
