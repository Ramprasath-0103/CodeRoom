import * as Y from "yjs";
import { ydoc } from "./yjs";

export function bindMonacoToYText(
  editor: any,
  ytext: Y.Text,
  onLocalChange?: () => void,
) {
  const model = editor.getModel();
  if (!model) return () => {};

  if (ytext.toString() !== model.getValue()) {
    model.setValue(ytext.toString());
  }

  let applyingRemote = false;

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

  const onRemoteChange = (_event: Y.YTextEvent, transaction: Y.Transaction) => {
    if (transaction.origin === "local") return;

    applyingRemote = true;
    model.setValue(ytext.toString());
    applyingRemote = false;
  };

  ytext.observe(onRemoteChange);

  return () => {
    onModelChange.dispose();
    ytext.unobserve(onRemoteChange);
  };
}
