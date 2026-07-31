import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import { bindMonacoToYText } from "../yjsBinding";

// A faithful-enough fake of a Monaco text model + `monaco.Range`, exercising
// the real bindMonacoToYText against it. Enough of the API is implemented that
// the binding's offset math and echo-guards run exactly as in production.
class FakeModel {
  value: string;
  listeners: ((e: any) => void)[] = [];
  setValueCalls = 0;
  applyEditsCalls = 0;

  constructor(value = "") {
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  setValue(v: string) {
    this.setValueCalls++;
    const change = {
      rangeOffset: 0,
      rangeLength: this.value.length,
      text: v,
    };
    this.value = v;
    this.fire([change]);
  }

  onDidChangeContent(cb: (e: any) => void) {
    this.listeners.push(cb);
    return { dispose: () => (this.listeners = this.listeners.filter((l) => l !== cb)) };
  }

  getPositionAt(offset: number) {
    let line = 1;
    let column = 1;
    for (let i = 0; i < offset && i < this.value.length; i++) {
      if (this.value[i] === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return { lineNumber: line, column };
  }

  private positionToOffset(line: number, column: number) {
    const lines = this.value.split("\n");
    let offset = 0;
    for (let l = 0; l < line - 1; l++) offset += lines[l].length + 1;
    return offset + column - 1;
  }

  applyEdits(edits: any[]) {
    this.applyEditsCalls++;
    edits.forEach(({ range, text }) => {
      const s = this.positionToOffset(range.startLineNumber, range.startColumn);
      const e = this.positionToOffset(range.endLineNumber, range.endColumn);
      const change = { rangeOffset: s, rangeLength: e - s, text };
      this.value = this.value.slice(0, s) + text + this.value.slice(e);
      this.fire([change]);
    });
  }

  // Test helper: simulate a local user edit (what Monaco emits on typing).
  userEdit(offset: number, delLength: number, text: string) {
    this.value =
      this.value.slice(0, offset) + text + this.value.slice(offset + delLength);
    this.fire([{ rangeOffset: offset, rangeLength: delLength, text }]);
  }

  private fire(changes: any[]) {
    this.listeners.forEach((l) => l({ changes }));
  }
}

const fakeMonaco = {
  Range: class {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    constructor(sl: number, sc: number, el: number, ec: number) {
      this.startLineNumber = sl;
      this.startColumn = sc;
      this.endLineNumber = el;
      this.endColumn = ec;
    }
  },
};

function setup(initial = "") {
  const doc = new Y.Doc();
  const ytext = doc.getText("file");
  if (initial) ytext.insert(0, initial);
  const model = new FakeModel();
  const editor = { getModel: () => model };
  const unbind = bindMonacoToYText(editor, fakeMonaco, ytext);
  return { doc, ytext, model, unbind };
}

describe("bindMonacoToYText", () => {
  it("applies a remote insert into the model", () => {
    const { ytext, model } = setup();
    ytext.insert(0, "hello"); // origin != "local" -> treated as remote
    expect(model.getValue()).toBe("hello");
  });

  it("pushes a local model edit into the Y.Text", () => {
    const { ytext, model } = setup();
    model.userEdit(0, 0, "abc");
    expect(ytext.toString()).toBe("abc");
  });

  it("keeps model and Y.Text identical across mixed remote edits", () => {
    const { ytext, model } = setup();
    ytext.insert(0, "hello world");
    ytext.insert(5, " BIG");
    ytext.delete(0, 6);
    ytext.insert(ytext.length, "\nsecond line");
    expect(model.getValue()).toBe(ytext.toString());
  });

  it("applies remote edits via applyEdits, never setValue (preserves cursor)", () => {
    const { ytext, model } = setup();
    const before = model.setValueCalls;
    ytext.insert(0, "typed by peer");
    ytext.insert(5, "X");
    ytext.delete(0, 3);
    // The whole point of the fix: remote edits must not call setValue,
    // which would reset the local cursor/selection to 1:1.
    expect(model.setValueCalls).toBe(before);
    expect(model.applyEditsCalls).toBeGreaterThan(0);
    expect(model.getValue()).toBe(ytext.toString());
  });

  it("does not echo a local edit back into the model as a duplicate", () => {
    const { ytext, model } = setup();
    model.userEdit(0, 0, "hi");
    // ytext got "hi" from the local path; the observer must not re-apply it.
    expect(model.getValue()).toBe("hi");
    expect(ytext.toString()).toBe("hi");
  });

  it("stops syncing after unbind", () => {
    const { ytext, model, unbind } = setup();
    ytext.insert(0, "before");
    unbind();
    ytext.insert(0, "after ");
    expect(model.getValue()).toBe("before"); // no longer receiving updates
  });
});
