import type { HocuspocusProvider } from "@hocuspocus/provider";
import { USER_COLOR_COUNT } from "../utils/userColors";

export type Awareness = NonNullable<HocuspocusProvider["awareness"]>;

export interface PresenceUser {
  name: string;
  colorIndex: number;
}

export interface PresenceCursor {
  fileId: string;
  anchor: unknown;
  head: unknown;
}

export interface Peer {
  clientId: number;
  isSelf: boolean;
  user: PresenceUser;
  activeFileId: string | null;
  cursor: PresenceCursor | null;
  isTyping: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readUser(value: unknown): PresenceUser | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.colorIndex !== "number") {
    return null;
  }

  return {
    name: value.name,
    colorIndex: Math.abs(Math.trunc(value.colorIndex)) % USER_COLOR_COUNT,
  };
}

function readCursor(value: unknown): PresenceCursor | null {
  if (!isRecord(value) || typeof value.fileId !== "string") {
    return null;
  }

  return { fileId: value.fileId, anchor: value.anchor, head: value.head };
}

export function readPeer(clientId: number, state: unknown, selfClientId: number): Peer | null {
  if (!isRecord(state)) {
    return null;
  }

  const user = readUser(state.user);

  if (!user) {
    return null;
  }

  return {
    clientId,
    isSelf: clientId === selfClientId,
    user,
    activeFileId: typeof state.activeFileId === "string" ? state.activeFileId : null,
    cursor: readCursor(state.cursor),
    isTyping: state.isTyping === true,
  };
}

export function readPeers(awareness: Awareness): Peer[] {
  const peers: Peer[] = [];

  awareness.getStates().forEach((state, clientId) => {
    const peer = readPeer(clientId, state, awareness.clientID);

    if (peer) {
      peers.push(peer);
    }
  });

  return peers.sort((first, second) => Number(second.isSelf) - Number(first.isSelf) || first.clientId - second.clientId);
}
