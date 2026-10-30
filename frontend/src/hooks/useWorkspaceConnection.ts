import type { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";
import type * as Y from "yjs";
import {
  createWorkspaceProvider,
  WORKSPACE_NOT_FOUND_REASON,
  type ConnectionStatus,
} from "../collaboration/createWorkspaceProvider";
import type { Awareness } from "../collaboration/presence";

export interface WorkspaceSession {
  provider: HocuspocusProvider;
  doc: Y.Doc;
  awareness: Awareness;
}

interface WorkspaceConnection {
  session: WorkspaceSession | null;
  status: ConnectionStatus;
  error: string | null;
}

function describeRejection(reason: string): string {
  return reason === WORKSPACE_NOT_FOUND_REASON
    ? "This workspace does not exist."
    : "You are not allowed to join this workspace.";
}

export function useWorkspaceConnection(workspaceId: string): WorkspaceConnection {
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const provider = createWorkspaceProvider(workspaceId, {
      onSynced: () => {
        if (isActive && provider.awareness) {
          setSession({ provider, doc: provider.document, awareness: provider.awareness });
        }
      },
      onStatusChange: (nextStatus) => {
        if (isActive) {
          setStatus(nextStatus);
        }
      },
      onRejected: (reason) => {
        if (isActive) {
          setError(describeRejection(reason));
          provider.destroy();
        }
      },
    });

    return () => {
      isActive = false;
      provider.destroy();
    };
  }, [workspaceId]);

  return { session, status, error };
}
