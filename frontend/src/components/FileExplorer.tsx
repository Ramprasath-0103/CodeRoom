import { useState } from "react";
import type { WorkspaceFile } from "../collaboration/workspaceDocument";
import FileNameForm from "./FileNameForm";
import "./FileExplorer.css";

interface FileExplorerProps {
  files: WorkspaceFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string) => string | null;
  onRenameFile: (fileId: string, name: string) => string | null;
  onDeleteFile: (fileId: string) => void;
}

type EditingState = { mode: "idle" } | { mode: "creating" } | { mode: "renaming"; fileId: string };

export default function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
}: FileExplorerProps) {
  const [editing, setEditing] = useState<EditingState>({ mode: "idle" });
  const stopEditing = () => setEditing({ mode: "idle" });

  function submitWhenValid(error: string | null): string | null {
    if (!error) {
      stopEditing();
    }

    return error;
  }

  function confirmDelete(file: WorkspaceFile) {
    if (window.confirm(`Delete ${file.name} for everyone in this workspace?`)) {
      onDeleteFile(file.id);
    }
  }

  return (
    <nav className="file-explorer" aria-label="Files">
      <div className="file-explorer-header">
        <h3>Files</h3>
        <button className="icon" aria-label="New file" onClick={() => setEditing({ mode: "creating" })}>
          +
        </button>
      </div>

      {editing.mode === "creating" && (
        <FileNameForm
          submitLabel="New file name"
          onSubmit={(name) => submitWhenValid(onCreateFile(name))}
          onCancel={stopEditing}
        />
      )}

      {files.length === 0 && editing.mode !== "creating" && (
        <p className="file-explorer-empty">No files yet. Create one with +.</p>
      )}

      {files.map((file) =>
        editing.mode === "renaming" && editing.fileId === file.id ? (
          <FileNameForm
            key={file.id}
            initialName={file.name}
            submitLabel={`Rename ${file.name}`}
            onSubmit={(name) => submitWhenValid(onRenameFile(file.id, name))}
            onCancel={stopEditing}
          />
        ) : (
          <div key={file.id} className={`file-row ${file.id === activeFileId ? "active" : ""}`}>
            <button className="file-name" onClick={() => onSelectFile(file.id)}>
              {file.name}
            </button>

            <div className="file-actions">
              <button
                className="icon"
                aria-label={`Rename ${file.name}`}
                onClick={() => setEditing({ mode: "renaming", fileId: file.id })}
              >
                ✏️
              </button>
              <button className="icon" aria-label={`Delete ${file.name}`} onClick={() => confirmDelete(file)}>
                🗑️
              </button>
            </div>
          </div>
        ),
      )}
    </nav>
  );
}
