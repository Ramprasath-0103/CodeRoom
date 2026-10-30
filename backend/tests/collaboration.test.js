import http from "node:http";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { attachCollaboration } from "../src/collaboration/attachCollaboration.js";
import {
  persistOpenDocuments,
  WORKSPACE_NOT_FOUND_REASON,
} from "../src/collaboration/collaborationServer.js";
import {
  addFile,
  createInitialWorkspaceState,
  FILES_KEY,
  readFiles,
} from "../src/collaboration/workspaceDocument.js";
import { generateWorkspaceId } from "../src/workspaces/workspaceId.js";
import { insertWorkspace, storedWorkspaces } from "./support/memoryWorkspaceRepository.js";

vi.mock("../src/workspaces/workspaceRepository.js", () => import("./support/memoryWorkspaceRepository.js"));

let workspaceId;
let httpServer;
let baseUrl;
let providers = [];

function connect(name = workspaceId) {
  const provider = new HocuspocusProvider({ url: `${baseUrl}/collaboration`, name });
  providers.push(provider);
  return provider;
}

function waitForSync(provider) {
  return new Promise((resolve) => {
    if (provider.synced) {
      resolve();
      return;
    }

    provider.on("synced", () => resolve());
  });
}

function waitFor(check) {
  return vi.waitFor(() => expect(check()).toBe(true), { timeout: 3000, interval: 20 });
}

beforeAll(async () => {
  httpServer = http.createServer();
  attachCollaboration(httpServer);
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  baseUrl = `ws://127.0.0.1:${httpServer.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

beforeEach(async () => {
  workspaceId = generateWorkspaceId();
  await insertWorkspace(workspaceId, createInitialWorkspaceState());
});

afterEach(() => {
  providers.forEach((provider) => provider.destroy());
  providers = [];
});

describe("collaboration server", () => {
  it("loads the stored workspace for a new client", async () => {
    const provider = connect();
    await waitForSync(provider);

    expect(readFiles(provider.document).map((file) => file.name)).toEqual(["main.js"]);
  });

  it("syncs file creation and edits between two clients", async () => {
    const alice = connect();
    const bob = connect();
    await Promise.all([waitForSync(alice), waitForSync(bob)]);

    addFile(alice.document, { id: "file-2", name: "notes.md", content: "" });
    await waitFor(() => bob.document.getMap(FILES_KEY).has("file-2"));

    alice.document.getMap(FILES_KEY).get("file-2").get("content").insert(0, "from alice");
    bob.document.getMap(FILES_KEY).get("file-2").get("content").insert(0, "bob + ");

    await waitFor(() => {
      const aliceText = alice.document.getMap(FILES_KEY).get("file-2").get("content").toString();
      const bobText = bob.document.getMap(FILES_KEY).get("file-2").get("content").toString();
      return aliceText === bobText && aliceText.includes("from alice") && aliceText.includes("bob + ");
    });
  });

  it("removes a deleted file for every client", async () => {
    const alice = connect();
    const bob = connect();
    await Promise.all([waitForSync(alice), waitForSync(bob)]);
    const [mainFile] = readFiles(alice.document);

    alice.document.getMap(FILES_KEY).delete(mainFile.id);

    await waitFor(() => bob.document.getMap(FILES_KEY).size === 0);
  });

  it("persists open documents to the repository", async () => {
    const provider = connect();
    await waitForSync(provider);
    addFile(provider.document, { id: "file-3", name: "saved.py", content: "print('saved')" });
    await waitFor(() => provider.unsyncedChanges === 0);

    const { failed } = await persistOpenDocuments();

    expect(failed).toBe(0);

    const savedDoc = new Y.Doc();
    Y.applyUpdate(savedDoc, storedWorkspaces.get(workspaceId).state);
    expect(readFiles(savedDoc).map((file) => file.name).sort()).toEqual(["main.js", "saved.py"]);
  });

  it("rejects clients that ask for a workspace that does not exist", async () => {
    const provider = connect("MISSING1");

    const reason = await new Promise((resolve) => {
      provider.on("authenticationFailed", ({ reason: failureReason }) => resolve(failureReason));
    });

    expect(reason).toBe(WORKSPACE_NOT_FOUND_REASON);
    expect(provider.synced).toBe(false);
  });

  it("refuses WebSocket upgrades on other paths", async () => {
    const socket = new WebSocket(`${baseUrl}/somewhere-else`);

    const outcome = await new Promise((resolve) => {
      socket.addEventListener("open", () => resolve("open"));
      socket.addEventListener("error", () => resolve("error"));
    });

    expect(outcome).toBe("error");
  });
});
