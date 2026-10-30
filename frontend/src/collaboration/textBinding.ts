import * as Y from "yjs";

interface ModelPosition {
  lineNumber: number;
  column: number;
}

interface ModelRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

interface ModelContentChange {
  rangeOffset: number;
  rangeLength: number;
  text: string;
}

export interface BindableTextModel {
  getValue(): string;
  setValue(value: string): void;
  getPositionAt(offset: number): ModelPosition;
  applyEdits(edits: { range: ModelRange; text: string }[]): void;
  onDidChangeContent(listener: (event: { changes: readonly ModelContentChange[] }) => void): {
    dispose(): void;
  };
}

export interface TextBinding {
  undo(): void;
  redo(): void;
  destroy(): void;
}

interface OffsetEdit {
  start: number;
  end: number;
  text: string;
}

export function deltaToOffsetEdits(delta: Y.YTextEvent["delta"]): OffsetEdit[] {
  const edits: OffsetEdit[] = [];
  let offset = 0;

  for (const operation of delta) {
    if (operation.retain !== undefined) {
      offset += operation.retain;
      continue;
    }

    const edit: OffsetEdit =
      operation.delete !== undefined
        ? { start: offset, end: offset + operation.delete, text: "" }
        : { start: offset, end: offset, text: typeof operation.insert === "string" ? operation.insert : "" };

    offset = edit.end;

    const previous = edits.at(-1);

    if (previous && previous.end === edit.start) {
      previous.end = edit.end;
      previous.text += edit.text;
    } else {
      edits.push(edit);
    }
  }

  return edits;
}

function toModelRange(model: BindableTextModel, start: number, end: number): ModelRange {
  const startPosition = model.getPositionAt(start);
  const endPosition = model.getPositionAt(end);

  return {
    startLineNumber: startPosition.lineNumber,
    startColumn: startPosition.column,
    endLineNumber: endPosition.lineNumber,
    endColumn: endPosition.column,
  };
}

export function bindModelToText(
  model: BindableTextModel,
  text: Y.Text,
  onLocalChange?: () => void,
): TextBinding {
  const localOrigin = Symbol("local-editor-change");
  const undoManager = new Y.UndoManager(text, { trackedOrigins: new Set([localOrigin]) });
  let isApplyingRemoteChange = false;

  const applyRemoteChange = (change: () => void) => {
    isApplyingRemoteChange = true;

    try {
      change();
    } finally {
      isApplyingRemoteChange = false;
    }
  };

  if (model.getValue() !== text.toString()) {
    applyRemoteChange(() => model.setValue(text.toString()));
  }

  const contentListener = model.onDidChangeContent(({ changes }) => {
    if (isApplyingRemoteChange || !text.doc) {
      return;
    }

    text.doc.transact(() => {
      [...changes]
        .sort((first, second) => second.rangeOffset - first.rangeOffset)
        .forEach(({ rangeOffset, rangeLength, text: insertedText }) => {
          if (rangeLength > 0) {
            text.delete(rangeOffset, rangeLength);
          }

          if (insertedText) {
            text.insert(rangeOffset, insertedText);
          }
        });
    }, localOrigin);

    onLocalChange?.();
  });

  const textObserver = (event: Y.YTextEvent, transaction: Y.Transaction) => {
    if (transaction.origin === localOrigin) {
      return;
    }

    const edits = deltaToOffsetEdits(event.delta).map(({ start, end, text: insertedText }) => ({
      range: toModelRange(model, start, end),
      text: insertedText,
    }));

    applyRemoteChange(() => model.applyEdits(edits));
  };

  text.observe(textObserver);

  return {
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
    destroy: () => {
      contentListener.dispose();
      text.unobserve(textObserver);
      undoManager.destroy();
    },
  };
}
