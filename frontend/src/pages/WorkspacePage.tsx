import { useEffect, useState } from "react";
import ActivityPanel from "../components/ActivityPanel";
import CodeEditor from "../components/CodeEditor";
import ConnectionBadge from "../components/ConnectionBadge";
import FileExplorer from "../components/FileExplorer";
import OutputPanel from "../components/OutputPanel";
import PresenceList from "../components/PresenceList";
import StatusScreen from "../components/StatusScreen";
import type { ConnectionStatus } from "../collaboration/createWorkspaceProvider";
import {
  createFile,
  deleteFile,
  getFileContent,
  renameFile,
  validateFileName,
} from "../collaboration/workspaceDocument";
import { MAX_DISPLAY_NAME_LENGTH, toEffectiveName, useDisplayName } from "../hooks/useDisplayName";
import { usePresence } from "../hooks/usePresence";
import { useWorkspaceConnection, type WorkspaceSession } from "../hooks/useWorkspaceConnection";
import { useWorkspaceFiles } from "../hooks/useWorkspaceFiles";
import { getLanguageForFileName, getStarterSnippet } from "../utils/languages";
import { readStorage, STORAGE_KEYS, writeStorage } from "../utils/storage";
import { getUserColorIndex } from "../utils/userColors";
import "./WorkspacePage.css";

const COPY_FEEDBACK_MS = 1500;

interface WorkspaceViewProps {
  workspaceId: string;
  session: WorkspaceSession;
  status: ConnectionStatus;
}

function WorkspaceView({ workspaceId, session, status }: WorkspaceViewProps) {
  const { doc, awareness } = session;
  const files = useWorkspaceFiles(doc);
  const { peers, activity } = usePresence(awareness);
  const [displayName, setDisplayName] = useDisplayName();
  const [selectedFileId, setSelectedFileId] = useState(() =>
    readStorage(STORAGE_KEYS.activeFile(workspaceId)),
  );
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const activeFile = files.find((file) => file.id === selectedFileId) ?? files[0] ?? null;
  const activeText = activeFile ? getFileContent(doc, activeFile.id) : null;
  const language = activeFile ? getLanguageForFileName(activeFile.name) : "plaintext";
  const userName = toEffectiveName(displayName);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.lastWorkspace, workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    awareness.setLocalStateField("user", { name: userName, colorIndex: getUserColorIndex(userName) });
  }, [awareness, userName]);

  useEffect(() => {
    awareness.setLocalStateField("activeFileId", activeFile?.id ?? null);
  }, [awareness, activeFile?.id]);

  function selectFile(fileId: string) {
    setSelectedFileId(fileId);
    writeStorage(STORAGE_KEYS.activeFile(workspaceId), fileId);
  }

  function handleCreateFile(name: string): string | null {
    const error = validateFileName(doc, name);

    if (error) {
      return error;
    }

    selectFile(createFile(doc, name, getStarterSnippet(name.trim())));
    return null;
  }

  function handleRenameFile(fileId: string, name: string): string | null {
    const error = validateFileName(doc, name, fileId);

    if (error) {
      return error;
    }

    renameFile(doc, fileId, name);
    return null;
  }

  async function copyWorkspaceLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), COPY_FEEDBACK_MS);
    } catch {
      setIsLinkCopied(false);
    }
  }

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-title">
          <h1>CodeRoom</h1>
          <span className="workspace-id">{workspaceId}</span>
          <button className="icon" onClick={copyWorkspaceLink}>
            {isLinkCopied ? "Copied!" : "Copy link"}
          </button>
          <ConnectionBadge status={status} />
        </div>

        <div className="workspace-people">
          <input
            aria-label="Your name"
            className="workspace-name-input"
            value={displayName}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <PresenceList peers={peers} files={files} />
        </div>
      </header>

      <div className="workspace-body">
        <FileExplorer
          files={files}
          activeFileId={activeFile?.id ?? null}
          onSelectFile={selectFile}
          onCreateFile={handleCreateFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={(fileId) => deleteFile(doc, fileId)}
        />

        <main className="workspace-main">
          <section className="editor-pane" aria-label="Editor">
            {activeFile && activeText ? (
              <CodeEditor
                key={activeFile.id}
                fileId={activeFile.id}
                text={activeText}
                awareness={awareness}
                language={language}
              />
            ) : (
              <p className="editor-empty">Create a file to start coding.</p>
            )}
          </section>

          <section className="output-pane" aria-label="Output">
            <OutputPanel language={language} readSourceCode={() => activeText?.toString() ?? ""} />
          </section>
        </main>

        <ActivityPanel activity={activity} peers={peers} files={files} />
      </div>
    </div>
  );
}

interface WorkspacePageProps {
  workspaceId: string;
}

export default function WorkspacePage({ workspaceId }: WorkspacePageProps) {
  const { session, status, error } = useWorkspaceConnection(workspaceId);

  if (error) {
    return <StatusScreen message={error} showHomeLink />;
  }

  if (!session) {
    const isOffline = status === "disconnected";

    return (
      <StatusScreen
        message={isOffline ? "Can't reach the server, retrying…" : "Connecting to workspace…"}
        showHomeLink={isOffline}
      />
    );
  }

  return <WorkspaceView workspaceId={workspaceId} session={session} status={status} />;
}
