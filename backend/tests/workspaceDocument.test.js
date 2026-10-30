import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  addFile,
  createInitialWorkspaceState,
  FILES_KEY,
  readFiles,
} from "../src/collaboration/workspaceDocument.js";

function docFromState(state) {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return doc;
}

describe("createInitialWorkspaceState", () => {
  it("contains a single main.js starter file", () => {
    const files = readFiles(docFromState(createInitialWorkspaceState()));

    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("main.js");
    expect(files[0].content).toContain("greet");
  });

  it("gives every new workspace a different file id", () => {
    const first = readFiles(docFromState(createInitialWorkspaceState()))[0];
    const second = readFiles(docFromState(createInitialWorkspaceState()))[0];

    expect(first.id).not.toBe(second.id);
  });
});

describe("addFile", () => {
  it("stores the file name, creation time and editable content", () => {
    const doc = new Y.Doc();
    const id = addFile(doc, { id: "file-1", name: "app.py", content: "print(1)", createdAt: 5 });
    const file = doc.getMap(FILES_KEY).get(id);

    expect(file.get("name")).toBe("app.py");
    expect(file.get("createdAt")).toBe(5);
    expect(file.get("content")).toBeInstanceOf(Y.Text);
    expect(file.get("content").toString()).toBe("print(1)");
  });

  it("syncs added files to another document", () => {
    const source = new Y.Doc();
    addFile(source, { id: "file-1", name: "a.js", content: "let a = 1;" });

    const files = readFiles(docFromState(Y.encodeStateAsUpdate(source)));

    expect(files).toEqual([
      expect.objectContaining({ id: "file-1", name: "a.js", content: "let a = 1;" }),
    ]);
  });
});
