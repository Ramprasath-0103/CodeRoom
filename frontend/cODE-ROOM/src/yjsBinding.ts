import * as Y from "yjs";
import { ydoc } from "./yjs";

export function bindMonacoToYText(
  editor: any,
  monaco: any,
  ytext: Y.Text,
  onLocalChange?: () => void,
) {
  const model = editor.getModel();
  if (!model) return () => {};

  let applyingRemote = false;

  // Seed the editor with whatever the shared doc already holds, without
  // echoing that back into Yjs as a local edit.
  if (ytext.toString() !== model.getValue()) {
    applyingRemote = true;
    model.setValue(ytext.toString());
    applyingRemote = false;
  }

  const onModelChange = model.onDidChangeContent((event: any) => {
    if (applyingRemote) return;

    onLocalChange?.();

    ydoc.transact(() => {
      event.changes
        .slice()
        .sort((a: any, b: any) => b.rangeOffset - a.rangeOffset)
        .forEach((change: any) => {
          ytext.delete(change.rangeOffset, change.rangeLength);
          ytext.insert(change.rangeOffset, change.text);
        });
    }, "local");
  });

  // Apply remote changes as granular edits so Monaco keeps the local cursor,
  // selection and scroll position intact (setValue would reset them to 1:1).
  const onRemoteChange = (event: Y.YTextEvent, transaction: Y.Transaction) => {
    if (transaction.origin === "local") return;

    applyingRemote = true;

    let index = 0;

    event.delta.forEach((op: any) => {
      if (op.retain != null) {
        index += op.retain;
      } else if (op.insert != null) {
        const pos = model.getPositionAt(index);
        model.applyEdits([
          {
            range: new monaco.Range(
              pos.lineNumber,
              pos.column,
              pos.lineNumber,
              pos.column,
            ),
            text: op.insert,
          },
        ]);
        index += op.insert.length;
      } else if (op.delete != null) {
        const start = model.getPositionAt(index);
        const end = model.getPositionAt(index + op.delete);
        model.applyEdits([
          {
            range: new monaco.Range(
              start.lineNumber,
              start.column,
              end.lineNumber,
              end.column,
            ),
            text: "",
          },
        ]);
      }
    });

    applyingRemote = false;
  };

  ytext.observe(onRemoteChange);

  return () => {
    onModelChange.dispose();
    ytext.unobserve(onRemoteChange);
  };
}
