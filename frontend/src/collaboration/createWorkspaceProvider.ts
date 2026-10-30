import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import { COLLABORATION_URL } from "../config/env";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export const WORKSPACE_NOT_FOUND_REASON = "workspace-not-found";

interface ProviderCallbacks {
  onSynced: () => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onRejected: (reason: string) => void;
}

function toConnectionStatus(status: WebSocketStatus): ConnectionStatus {
  if (status === WebSocketStatus.Connected) {
    return "connected";
  }

  return status === WebSocketStatus.Connecting ? "connecting" : "disconnected";
}

export function createWorkspaceProvider(workspaceId: string, callbacks: ProviderCallbacks) {
  return new HocuspocusProvider({
    url: COLLABORATION_URL,
    name: workspaceId,
    onSynced: ({ state }) => {
      if (state) {
        callbacks.onSynced();
      }
    },
    onStatus: ({ status }) => callbacks.onStatusChange(toConnectionStatus(status)),
    onAuthenticationFailed: ({ reason }) => callbacks.onRejected(reason),
  });
}
