import * as Y from "yjs";
import { createId } from "../utils/createId";

export const FILES_KEY = "files";

const MAX_FILE_NAME_LENGTH = 64;
const FILE_NAME_PATTERN = /^[\w.-]+$/;

export interface WorkspaceFile {
  id: string;
  name: string;
  createdAt: number;
}

type FileEntry = Y.Map<unknown>;

export function getFilesMap(doc: Y.Doc): Y.Map<FileEntry> {
  return doc.getMap<FileEntry>(FILES_KEY);
}

export function listFiles(doc: Y.Doc): WorkspaceFile[] {
  return Array.from(getFilesMap(doc).entries(), ([id, entry]) => ({
    id,
    name: String(entry.get("name") ?? "untitled"),
    createdAt: Number(entry.get("createdAt") ?? 0),
  })).sort((first, second) => first.createdAt - second.createdAt || first.name.localeCompare(second.name));
}

export function getFileContent(doc: Y.Doc, fileId: string): Y.Text | null {
  const content = getFilesMap(doc).get(fileId)?.get("content");
  return content instanceof Y.Text ? content : null;
}

export function validateFileName(doc: Y.Doc, rawName: string, renamingFileId?: string): string | null {
  const name = rawName.trim();

  if (!name) {
    return "File name cannot be empty";
  }

  if (name.length > MAX_FILE_NAME_LENGTH) {
    return `File name must be ${MAX_FILE_NAME_LENGTH} characters or fewer`;
  }

  if (!FILE_NAME_PATTERN.test(name)) {
    return "Use only letters, numbers, dots, dashes and underscores";
  }

  const isTaken = listFiles(doc).some(
    (file) => file.id !== renamingFileId && file.name.toLowerCase() === name.toLowerCase(),
  );

  return isTaken ? `A file named ${name} already exists` : null;
}

export function createFile(doc: Y.Doc, name: string, initialContent = ""): string {
  const id = createId();
  const entry = new Y.Map<unknown>();

  entry.set("name", name.trim());
  entry.set("createdAt", Date.now());
  entry.set("content", new Y.Text(initialContent));
  getFilesMap(doc).set(id, entry);

  return id;
}

export function renameFile(doc: Y.Doc, fileId: string, name: string): void {
  getFilesMap(doc).get(fileId)?.set("name", name.trim());
}

export function deleteFile(doc: Y.Doc, fileId: string): void {
  getFilesMap(doc).delete(fileId);
}
