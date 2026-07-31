import { describe, it, expect } from "vitest";
import * as Y from "yjs";

// Wires two Y.Docs together the way the transport (Hocuspocus) does: every
// update from one doc is applied to the other. Verifies the CRDT guarantees
// the app relies on — no server needed.
function connect(a: Y.Doc, b: Y.Doc) {
  a.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === "remote") return;
    Y.applyUpdate(b, update, "remote");
  });
  b.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === "remote") return;
    Y.applyUpdate(a, update, "remote");
  });
}

describe("CRDT sync", () => {
  it("propagates edits from one doc to the other", () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    connect(a, b);

    a.getText("file").insert(0, "hello");

    expect(b.getText("file").toString()).toBe("hello");
  });

  it("converges to the same text after concurrent edits", () => {
    const a = new Y.Doc();
    const b = new Y.Doc();

    // Seed a shared base state while "offline".
    a.getText("file").insert(0, "shared");
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a), "remote");

    // Now connect and edit both ends concurrently.
    connect(a, b);
    a.getText("file").insert(0, "A>");
    b.getText("file").insert(b.getText("file").length, "<B");

    // Both docs must reach an identical, non-lossy state.
    expect(a.getText("file").toString()).toBe(b.getText("file").toString());
    expect(a.getText("file").toString()).toContain("shared");
    expect(a.getText("file").toString()).toContain("A>");
    expect(a.getText("file").toString()).toContain("<B");
  });

  it("keeps separate text keys (files) independent within a doc", () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    connect(a, b);

    a.getText("file-1").insert(0, "one");
    a.getText("file-2").insert(0, "two");

    expect(b.getText("file-1").toString()).toBe("one");
    expect(b.getText("file-2").toString()).toBe("two");
  });
});
