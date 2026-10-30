import type { editor } from "monaco-editor";
import * as Y from "yjs";
import { readPeers, type Awareness } from "./presence";

interface RemoteCursorOptions {
  codeEditor: editor.IStandaloneCodeEditor;
  text: Y.Text;
  awareness: Awareness;
  fileId: string;
}

function toTextIndex(text: Y.Text, encodedPosition: unknown): number | null {
  if (!text.doc || encodedPosition === null || encodedPosition === undefined) {
    return null;
  }

  try {
    const relativePosition = Y.createRelativePositionFromJSON(encodedPosition);
    const absolutePosition = Y.createAbsolutePositionFromRelativePosition(relativePosition, text.doc);
    return absolutePosition?.type === text ? absolutePosition.index : null;
  } catch {
    return null;
  }
}

function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_{}[\]()#+\-.!<>|~]/g, "\\$&");
}

export function encodeTextIndex(text: Y.Text, index: number): unknown {
  return Y.relativePositionToJSON(Y.createRelativePositionFromTypeIndex(text, index));
}

export function showRemoteCursors({ codeEditor, text, awareness, fileId }: RemoteCursorOptions): () => void {
  const decorations = codeEditor.createDecorationsCollection();

  const render = () => {
    const model = codeEditor.getModel();

    if (!model) {
      return;
    }

    const nextDecorations: editor.IModelDeltaDecoration[] = [];

    for (const peer of readPeers(awareness)) {
      if (peer.isSelf || !peer.cursor || peer.cursor.fileId !== fileId) {
        continue;
      }

      const anchor = toTextIndex(text, peer.cursor.anchor);
      const head = toTextIndex(text, peer.cursor.head);

      if (anchor === null || head === null) {
        continue;
      }

      const start = model.getPositionAt(Math.min(anchor, head));
      const end = model.getPositionAt(Math.max(anchor, head));
      const caretClassName = `remote-caret remote-caret-${peer.user.colorIndex}`;

      nextDecorations.push({
        range: {
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
        },
        options: {
          className: `remote-selection remote-selection-${peer.user.colorIndex}`,
          hoverMessage: { value: escapeMarkdown(peer.user.name) },
          beforeContentClassName: head <= anchor ? caretClassName : null,
          afterContentClassName: head > anchor ? caretClassName : null,
        },
      });
    }

    decorations.set(nextDecorations);
  };

  awareness.on("change", render);
  text.observe(render);
  render();

  return () => {
    awareness.off("change", render);
    text.unobserve(render);
    decorations.clear();
  };
}
