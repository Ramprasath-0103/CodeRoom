import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { createApp } from "../src/app.js";
import { readFiles } from "../src/collaboration/workspaceDocument.js";
import { generateWorkspaceId } from "../src/workspaces/workspaceId.js";
import {
  insertWorkspace,
  resetStoredWorkspaces,
  storedWorkspaces,
} from "./support/memoryWorkspaceRepository.js";

vi.mock("../src/workspaces/workspaceRepository.js", () => import("./support/memoryWorkspaceRepository.js"));

vi.mock("../src/workspaces/workspaceId.js", async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, generateWorkspaceId: vi.fn(original.generateWorkspaceId) };
});

describe("workspace routes", () => {
  let app;

  beforeEach(() => {
    resetStoredWorkspaces();
    app = createApp();
  });

  it("creates a workspace seeded with a starter file", async () => {
    const response = await request(app).post("/api/workspaces").expect(201);

    expect(response.body.id).toMatch(/^[A-Z0-9]{8}$/);

    const doc = new Y.Doc();
    Y.applyUpdate(doc, storedWorkspaces.get(response.body.id).state);
    expect(readFiles(doc).map((file) => file.name)).toEqual(["main.js"]);
  });

  it("retries with a new id when the generated one already exists", async () => {
    await insertWorkspace("TAKEN234", new Uint8Array());
    vi.mocked(generateWorkspaceId)
      .mockReturnValueOnce("TAKEN234")
      .mockReturnValueOnce("FRESH567");

    const response = await request(app).post("/api/workspaces").expect(201);

    expect(response.body.id).toBe("FRESH567");
  });

  it("finds a workspace regardless of the id's letter case", async () => {
    await insertWorkspace("AB12CD34", new Uint8Array());

    const response = await request(app).get("/api/workspaces/ab12cd34").expect(200);

    expect(response.body.id).toBe("AB12CD34");
  });

  it("returns 404 for a workspace that does not exist", async () => {
    const response = await request(app).get("/api/workspaces/NOPE1234").expect(404);

    expect(response.body.message).toBe("Workspace not found");
  });

  it("returns 400 for an id with invalid characters", async () => {
    await request(app).get("/api/workspaces/bad-id!").expect(400);
  });
});

describe("app", () => {
  it("reports health", async () => {
    const response = await request(createApp()).get("/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
  });

  it("answers unknown routes with JSON 404", async () => {
    const response = await request(createApp()).get("/api/unknown").expect(404);

    expect(response.body.message).toContain("not found");
  });

  it("rejects malformed JSON bodies with 400", async () => {
    await request(createApp())
      .post("/api/execute")
      .set("Content-Type", "application/json")
      .send("{not json")
      .expect(400);
  });
});
