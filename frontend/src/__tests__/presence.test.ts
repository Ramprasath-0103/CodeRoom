import { describe, expect, it } from "vitest";
import { readPeer } from "../collaboration/presence";

describe("readPeer", () => {
  it("reads a complete presence state", () => {
    const peer = readPeer(
      7,
      {
        user: { name: "Ada", colorIndex: 3 },
        activeFileId: "file-1",
        cursor: { fileId: "file-1", anchor: { a: 1 }, head: { h: 2 } },
        isTyping: true,
      },
      1,
    );

    expect(peer).toEqual({
      clientId: 7,
      isSelf: false,
      user: { name: "Ada", colorIndex: 3 },
      activeFileId: "file-1",
      cursor: { fileId: "file-1", anchor: { a: 1 }, head: { h: 2 } },
      isTyping: true,
    });
  });

  it("marks the local client as self", () => {
    expect(readPeer(1, { user: { name: "Me", colorIndex: 0 } }, 1)?.isSelf).toBe(true);
  });

  it("ignores clients that have not shared a user yet", () => {
    expect(readPeer(2, {}, 1)).toBeNull();
    expect(readPeer(2, { user: { name: 42 } }, 1)).toBeNull();
  });

  it("keeps color indexes inside the palette", () => {
    expect(readPeer(2, { user: { name: "X", colorIndex: 13.7 } }, 1)?.user.colorIndex).toBe(5);
    expect(readPeer(2, { user: { name: "X", colorIndex: -3 } }, 1)?.user.colorIndex).toBe(3);
  });

  it("drops malformed cursor and typing fields", () => {
    const peer = readPeer(2, { user: { name: "X", colorIndex: 1 }, cursor: "bad", isTyping: "yes" }, 1);

    expect(peer?.cursor).toBeNull();
    expect(peer?.isTyping).toBe(false);
  });
});
