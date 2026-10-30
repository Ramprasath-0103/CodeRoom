import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { bindModelToText, deltaToOffsetEdits, type BindableTextModel } from "../collaboration/textBinding";

interface Change {
  rangeOffset: number;
  rangeLength: number;
  text: string;
}

interface Range {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

class FakeTextModel implements BindableTextModel {
  value = "";
  setValueCalls = 0;
  applyEditsCalls = 0;
  private listeners: ((event: { changes: Change[] }) => void)[] = [];

  getValue() {
    return this.value;
  }

  setValue(value: string) {
    this.setValueCalls += 1;
    const change = { rangeOffset: 0, rangeLength: this.value.length, text: value };
    this.value = value;
    this.emit([change]);
  }

  getPositionAt(offset: number) {
    const before = this.value.slice(0, Math.min(offset, this.value.length)).split("\n");
    return { lineNumber: before.length, column: before[before.length - 1].length + 1 };
  }

  applyEdits(edits: { range: Range; text: string }[]) {
    this.applyEditsCalls += 1;
    const changes = edits
      .map(({ range, text }) => {
        const start = this.offsetAt(range.startLineNumber, range.startColumn);
        const end = this.offsetAt(range.endLineNumber, range.endColumn);
        return { rangeOffset: start, rangeLength: end - start, text };
      })
      .sort((first, second) => second.rangeOffset - first.rangeOffset);

    changes.forEach(({ rangeOffset, rangeLength, text }) => {
      this.value = this.value.slice(0, rangeOffset) + text + this.value.slice(rangeOffset + rangeLength);
    });
    this.emit(changes);
  }

  onDidChangeContent(listener: (event: { changes: Change[] }) => void) {
    this.listeners.push(listener);
    return { dispose: () => (this.listeners = this.listeners.filter((item) => item !== listener)) };
  }

  type(offset: number, deleteLength: number, text: string) {
    this.value = this.value.slice(0, offset) + text + this.value.slice(offset + deleteLength);
    this.emit([{ rangeOffset: offset, rangeLength: deleteLength, text }]);
  }

  private offsetAt(lineNumber: number, column: number) {
    const lines = this.value.split("\n");
    const lineOffset = lines.slice(0, lineNumber - 1).reduce((total, line) => total + line.length + 1, 0);
    return lineOffset + column - 1;
  }

  private emit(changes: Change[]) {
    this.listeners.forEach((listener) => listener({ changes }));
  }
}

function setup(initialText = "") {
  const doc = new Y.Doc();
  const text = doc.getText("content");
  text.insert(0, initialText);
  const model = new FakeTextModel();
  let localChangeCount = 0;
  const binding = bindModelToText(model, text, () => {
    localChangeCount += 1;
  });
  return { doc, text, model, binding, localChanges: () => localChangeCount };
}

describe("deltaToOffsetEdits", () => {
  it("merges a delete followed by an insert into one replacement", () => {
    expect(deltaToOffsetEdits([{ retain: 2 }, { delete: 3 }, { insert: "xy" }])).toEqual([
      { start: 2, end: 5, text: "xy" },
    ]);
  });

  it("keeps separate edits for separate positions", () => {
    expect(deltaToOffsetEdits([{ insert: "a" }, { retain: 4 }, { delete: 1 }])).toEqual([
      { start: 0, end: 0, text: "a" },
      { start: 4, end: 5, text: "" },
    ]);
  });
});

describe("bindModelToText", () => {
  it("loads the shared text into the editor when binding", () => {
    const { model, localChanges } = setup("hello\nworld");

    expect(model.getValue()).toBe("hello\nworld");
    expect(localChanges()).toBe(0);
  });

  it("sends local typing into the shared text", () => {
    const { text, model, localChanges } = setup("abc");

    model.type(3, 0, "d");
    model.type(0, 1, "X");

    expect(text.toString()).toBe("Xbcd");
    expect(localChanges()).toBe(2);
  });

  it("applies remote edits in a single applyEdits call without resetting the model", () => {
    const { doc, text, model } = setup("line one\nline two");
    const setValueCallsBefore = model.setValueCalls;

    doc.transact(() => {
      text.insert(0, ">> ");
      text.delete(12, 4);
      text.insert(text.length, "!");
    });

    expect(model.getValue()).toBe(text.toString());
    expect(model.applyEditsCalls).toBe(1);
    expect(model.setValueCalls).toBe(setValueCallsBefore);
  });

  it("does not echo remote edits back as local changes", () => {
    const { text, localChanges } = setup();

    text.insert(0, "from a peer");

    expect(localChanges()).toBe(0);
  });

  it("undoes only the local user's edits", () => {
    const { text, model, binding } = setup("base");

    model.type(4, 0, " mine");
    text.insert(0, "peer ");
    binding.undo();

    expect(text.toString()).toBe("peer base");
    expect(model.getValue()).toBe("peer base");

    binding.redo();

    expect(text.toString()).toBe("peer base mine");
    expect(model.getValue()).toBe("peer base mine");
  });

  it("stops syncing in both directions after destroy", () => {
    const { text, model, binding } = setup("before");

    binding.destroy();
    text.insert(0, "remote ");
    model.type(0, 0, "local ");

    expect(model.getValue()).toBe("local before");
    expect(text.toString()).toBe("remote before");
  });
});
