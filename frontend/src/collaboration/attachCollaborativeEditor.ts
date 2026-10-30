import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type * as Y from "yjs";
import type { Awareness } from "./presence";
import { encodeTextIndex, showRemoteCursors } from "./remoteCursors";
import { bindModelToText } from "./textBinding";
import { createTypingIndicator } from "./typingIndicator";

interface CollaborativeEditorOptions {
  codeEditor: editor.IStandaloneCodeEditor;
  monaco: Monaco;
  text: Y.Text;
  awareness: Awareness;
  fileId: string;
}

export function attachCollaborativeEditor({
  codeEditor,
  monaco,
  text,
  awareness,
  fileId,
}: CollaborativeEditorOptions): () => void {
  const model = codeEditor.getModel();

  if (!model) {
    return () => undefined;
  }

  const typingIndicator = createTypingIndicator(awareness);
  const textBinding = bindModelToText(model, text, typingIndicator.markTyping);
  const hideRemoteCursors = showRemoteCursors({ codeEditor, text, awareness, fileId });
  let lastPublishedCursor = "";

  const publishCursor = () => {
    const selection = codeEditor.getSelection();

    if (!selection) {
      return;
    }

    const anchor = model.getOffsetAt({
      lineNumber: selection.selectionStartLineNumber,
      column: selection.selectionStartColumn,
    });
    const head = model.getOffsetAt(selection.getPosition());
    const cursor = { fileId, anchor: encodeTextIndex(text, anchor), head: encodeTextIndex(text, head) };
    const cursorKey = JSON.stringify(cursor);

    if (cursorKey !== lastPublishedCursor) {
      lastPublishedCursor = cursorKey;
      awareness.setLocalStateField("cursor", cursor);
    }
  };

  const selectionListener = codeEditor.onDidChangeCursorSelection(publishCursor);
  publishCursor();

  const { KeyCode, KeyMod } = monaco;
  codeEditor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyZ, textBinding.undo);
  codeEditor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ, textBinding.redo);
  codeEditor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyY, textBinding.redo);

  return () => {
    selectionListener.dispose();
    hideRemoteCursors();
    textBinding.destroy();
    typingIndicator.destroy();
    awareness.setLocalStateField("cursor", null);
  };
}
