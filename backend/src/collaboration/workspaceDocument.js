import { randomUUID } from "node:crypto";
import * as Y from "yjs";

export const FILES_KEY = "files";

const STARTER_FILE = {
  name: "main.js",
  content: 'function greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n',
};

export function addFile(doc, { id = randomUUID(), name, content = "", createdAt = Date.now() }) {
  const file = new Y.Map();
  file.set("name", name);
  file.set("createdAt", createdAt);
  file.set("content", new Y.Text(content));
  doc.getMap(FILES_KEY).set(id, file);
  return id;
}

export function readFiles(doc) {
  return Array.from(doc.getMap(FILES_KEY).entries(), ([id, file]) => ({
    id,
    name: file.get("name"),
    createdAt: file.get("createdAt"),
    content: file.get("content").toString(),
  }));
}

export function createInitialWorkspaceState() {
  const doc = new Y.Doc();
  addFile(doc, STARTER_FILE);
  return Y.encodeStateAsUpdate(doc);
}
