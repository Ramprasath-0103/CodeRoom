import * as Y from "yjs";

const ydoc = new Y.Doc();

const textMap = new Map<string, Y.Text>();

export function getYText(fileId: string): Y.Text {
  let text = textMap.get(fileId);

  if (!text) {
    text = ydoc.getText(fileId);
    textMap.set(fileId, text);
  }

  return text;
}

export { ydoc };