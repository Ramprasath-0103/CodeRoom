import type { Peer } from "../collaboration/presence";
import type { WorkspaceFile } from "../collaboration/workspaceDocument";
import type { ActivityEntry } from "../hooks/usePresence";
import "./ActivityPanel.css";

const VISIBLE_ACTIVITY_COUNT = 8;

interface ActivityPanelProps {
  activity: ActivityEntry[];
  peers: Peer[];
  files: WorkspaceFile[];
}

export default function ActivityPanel({ activity, peers, files }: ActivityPanelProps) {
  const fileNames = new Map(files.map((file) => [file.id, file.name]));
  const typingPeers = peers.filter((peer) => peer.isTyping && !peer.isSelf);

  return (
    <aside className="activity-panel">
      <section>
        <h3>Activity</h3>
        {activity.length === 0 ? (
          <p className="activity-empty">No activity yet.</p>
        ) : (
          <ul>
            {activity.slice(0, VISIBLE_ACTIVITY_COUNT).map((entry) => (
              <li key={entry.id}>{entry.message}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Typing</h3>
        {typingPeers.length === 0 ? (
          <p className="activity-empty">No one is typing.</p>
        ) : (
          <ul>
            {typingPeers.map((peer) => (
              <li key={peer.clientId}>
                {peer.user.name} in {fileNames.get(peer.activeFileId ?? "") ?? "a file"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
