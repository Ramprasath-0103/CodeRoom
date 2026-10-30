import type { ConnectionStatus } from "../collaboration/createWorkspaceProvider";
import "./ConnectionBadge.css";

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: "Live",
  connecting: "Reconnecting…",
  disconnected: "Offline",
};

interface ConnectionBadgeProps {
  status: ConnectionStatus;
}

export default function ConnectionBadge({ status }: ConnectionBadgeProps) {
  return (
    <span className={`connection-badge connection-badge-${status}`} role="status">
      <span className="dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}
