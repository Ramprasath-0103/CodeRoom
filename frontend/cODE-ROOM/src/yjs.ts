import * as Y from "yjs";

const ydoc = new Y.Doc();

const textMap = new Map<string, Y.Text>();

export function getYText(fileId: string) {
  if (!textMap.has(fileId)) {
    textMap.set(fileId, ydoc.getText(fileId));
  }

  return textMap.get(fileId)!;
}

export { ydoc };