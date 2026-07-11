import "./FileExplorer.css";

interface FileType {
  id: string;
  name: string;
  content: string;
}

interface FileExplorerProps {
  files: FileType[];
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  addFile: () => void;
  renameFile: (id: string) => void;
  deleteFile: (id: string) => void;
}

function FileExplorer({
  files,
  activeFileId,
  setActiveFileId,
  addFile,
  renameFile,
  deleteFile,
}: FileExplorerProps) {
  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Files</h3>

        <button className="icon" onClick={addFile}>
          +
        </button>
      </div>

      {files.map((file) => (
        <div
          key={file.id}
          className={`file-row ${file.id === activeFileId ? "active" : ""}`}
        >
          <span className="file-name" onClick={() => setActiveFileId(file.id)}>
            {file.name}
          </span>

          <div className="file-actions">
            <button className="icon" onClick={() => renameFile(file.id)}>
              ✏️
            </button>

            <button className="icon" onClick={() => deleteFile(file.id)}>
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FileExplorer;
