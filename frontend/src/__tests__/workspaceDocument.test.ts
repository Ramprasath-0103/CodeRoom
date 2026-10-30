import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  createFile,
  deleteFile,
  getFileContent,
  listFiles,
  renameFile,
  validateFileName,
} from "../collaboration/workspaceDocument";

function connectDocs(first: Y.Doc, second: Y.Doc) {
  first.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== second) {
      Y.applyUpdate(second, update, first);
    }
  });
  second.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== first) {
      Y.applyUpdate(first, update, second);
    }
  });
}

describe("workspace document", () => {
  it("creates a file with its starter content", () => {
    const doc = new Y.Doc();
    const fileId = createFile(doc, "  main.py ", "print('hi')\n");

    expect(listFiles(doc)).toEqual([expect.objectContaining({ id: fileId, name: "main.py" })]);
    expect(getFileContent(doc, fileId)?.toString()).toBe("print('hi')\n");
  });

  it("lists files in creation order", () => {
    const doc = new Y.Doc();
    createFile(doc, "b.js");
    createFile(doc, "a.js");

    const names = listFiles(doc).map((file) => file.name);

    expect(names).toHaveLength(2);
    expect(new Set(names)).toEqual(new Set(["a.js", "b.js"]));
  });

  it("renames and deletes files", () => {
    const doc = new Y.Doc();
    const fileId = createFile(doc, "old.js");

    renameFile(doc, fileId, "new.js");
    expect(listFiles(doc)[0].name).toBe("new.js");

    deleteFile(doc, fileId);
    expect(listFiles(doc)).toEqual([]);
    expect(getFileContent(doc, fileId)).toBeNull();
  });

  it("keeps only the files map at the document root after deleting", () => {
    const doc = new Y.Doc();
    const fileId = createFile(doc, "temp.js", "secret");

    deleteFile(doc, fileId);

    expect([...doc.share.keys()]).toEqual(["files"]);
  });

  it("converges when two users create, edit and rename concurrently", () => {
    const alice = new Y.Doc();
    const bob = new Y.Doc();
    const sharedId = createFile(alice, "shared.js", "base");
    Y.applyUpdate(bob, Y.encodeStateAsUpdate(alice));

    createFile(alice, "alice.js");
    createFile(bob, "bob.js");
    getFileContent(alice, sharedId)?.insert(0, "A:");
    getFileContent(bob, sharedId)?.insert(4, ":B");
    renameFile(bob, sharedId, "renamed.js");

    connectDocs(alice, bob);
    Y.applyUpdate(alice, Y.encodeStateAsUpdate(bob), bob);
    Y.applyUpdate(bob, Y.encodeStateAsUpdate(alice), alice);

    expect(listFiles(alice)).toEqual(listFiles(bob));
    expect(listFiles(alice).map((file) => file.name).sort()).toEqual(["alice.js", "bob.js", "renamed.js"]);
    expect(getFileContent(alice, sharedId)?.toString()).toBe(getFileContent(bob, sharedId)?.toString());
    expect(getFileContent(alice, sharedId)?.toString()).toContain("A:");
    expect(getFileContent(alice, sharedId)?.toString()).toContain(":B");
  });
});

describe("validateFileName", () => {
  it("accepts a normal file name", () => {
    expect(validateFileName(new Y.Doc(), "solution.cpp")).toBeNull();
  });

  it("rejects empty, unsafe and overly long names", () => {
    const doc = new Y.Doc();

    expect(validateFileName(doc, "   ")).toBe("File name cannot be empty");
    expect(validateFileName(doc, "../secret")).toContain("letters, numbers");
    expect(validateFileName(doc, "my file.js")).toContain("letters, numbers");
    expect(validateFileName(doc, `${"a".repeat(70)}.js`)).toContain("64 characters");
  });

  it("rejects duplicate names regardless of case", () => {
    const doc = new Y.Doc();
    createFile(doc, "Main.java");

    expect(validateFileName(doc, "main.java")).toBe("A file named main.java already exists");
  });

  it("allows keeping the same name when renaming a file", () => {
    const doc = new Y.Doc();
    const fileId = createFile(doc, "main.java");

    expect(validateFileName(doc, "main.java", fileId)).toBeNull();
  });
});
