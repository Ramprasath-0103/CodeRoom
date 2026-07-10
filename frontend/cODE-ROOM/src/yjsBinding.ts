import * as Y from "yjs";
import { ydoc } from "./yjs";

export function bindMonacoToYText(editor: any, ytext: Y.Text) {
  const model = editor.getModel();
  if (!model) return () => {};

  if (ytext.length === 0 && model.getValue().length > 0) {
    ytext.insert(0, model.getValue());
  } else if (ytext.toString() !== model.getValue()) {
    model.setValue(ytext.toString());
  }

  let applyingRemote = false;

  const onLocalChange = model.onDidChangeContent((event: any) => {
    if (applyingRemote) return;

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
    onLocalChange.dispose();
    ytext.unobserve(onRemoteChange);
  };
}
