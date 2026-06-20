interface FileType {
  id: number;
  name: string;
  content: string;
}

interface FileExplorerProps {
  files: FileType[];
  activeFileId: number;
  setActiveFileId: (id: number) => void;
  addFile: () => void;
  renameFile: (id: number) => void;
  deleteFile: (id: number) => void;
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
    <div
      style={{
        width: "250px",
        borderRight: "1px solid gray",
        padding: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h3>Files</h3>

        <button onClick={addFile}>+</button>
      </div>

      {files.map((file) => (
        <div
          key={file.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px",
            marginBottom: "4px",
            backgroundColor: file.id === activeFileId ? "#333" : "transparent",
            color: file.id === activeFileId ? "white" : "inherit",
          }}
        >
          <span
            onClick={() => setActiveFileId(file.id)}
            style={{
              cursor: "pointer",
              flex: 1,
            }}
          >
            {file.name}
          </span>

          <div
            style={{
              display: "flex",
              gap: "4px",
            }}
          >
            <button onClick={() => renameFile(file.id)}>✏️</button>

            <button onClick={() => deleteFile(file.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FileExplorer;
