import type { Peer } from "../collaboration/presence";
import type { WorkspaceFile } from "../collaboration/workspaceDocument";
import { getUserColor } from "../utils/userColors";
import "./PresenceList.css";

interface PresenceListProps {
  peers: Peer[];
  files: WorkspaceFile[];
}

export default function PresenceList({ peers, files }: PresenceListProps) {
  const fileNames = new Map(files.map((file) => [file.id, file.name]));

  return (
    <ul className="presence-list" aria-label="People in this workspace">
      {peers.map((peer) => {
        const fileName = peer.activeFileId ? fileNames.get(peer.activeFileId) : undefined;

        return (
          <li key={peer.clientId} className="presence-user">
            <span className="dot" style={{ background: getUserColor(peer.user.colorIndex) }} />
            <span>{peer.isSelf ? `${peer.user.name} (you)` : peer.user.name}</span>
            {fileName && <span className="presence-file">{fileName}</span>}
          </li>
        );
      })}
    </ul>
  );
}
