import { Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";
import { isValidWorkspaceId } from "../workspaces/workspaceId.js";
import {
  loadWorkspaceState,
  saveWorkspaceState,
  workspaceExists,
} from "../workspaces/workspaceRepository.js";

export const WORKSPACE_NOT_FOUND_REASON = "workspace-not-found";

function workspaceNotFoundError(documentName) {
  const error = new Error(`Workspace ${documentName} does not exist`);
  error.reason = WORKSPACE_NOT_FOUND_REASON;
  return error;
}

export const collaborationServer = new Hocuspocus({
  quiet: true,

  async onConnect({ documentName }) {
    if (!isValidWorkspaceId(documentName) || !(await workspaceExists(documentName))) {
      throw workspaceNotFoundError(documentName);
    }
  },

  async onLoadDocument({ document, documentName }) {
    const state = await loadWorkspaceState(documentName);

    if (state) {
      Y.applyUpdate(document, state);
    }
  },

  async onStoreDocument({ document, documentName }) {
    await saveWorkspaceState(documentName, Y.encodeStateAsUpdate(document));
  },
});

export async function persistOpenDocuments() {
  const documents = [...collaborationServer.documents.values()];

  const results = await Promise.allSettled(
    documents.map((document) => saveWorkspaceState(document.name, Y.encodeStateAsUpdate(document))),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Failed to save workspace ${documents[index].name}:`, result.reason);
    }
  });

  return {
    saved: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}
