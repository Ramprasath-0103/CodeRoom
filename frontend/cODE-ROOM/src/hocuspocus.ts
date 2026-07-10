import { HocuspocusProvider } from "@hocuspocus/provider";
import { ydoc } from "./yjs";

export function connectYjsProvider(workspaceId: string) {
  return new HocuspocusProvider({
    url: "ws://localhost:1234",
    name: workspaceId,
    document: ydoc,
  });
}
