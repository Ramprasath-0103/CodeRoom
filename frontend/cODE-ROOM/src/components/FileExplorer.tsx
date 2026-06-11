interface FileType {
  id: number;
  name: string;
  content: string;
}

interface FileExplorerProps {
  files: FileType[];
  activeFileId: number;
  setActiveFileId: (id: number) => void;
}

interface FileExplorerProps {
  files: FileType[];
  activeFileId: number;
  setActiveFileId: (id: number) => void;
  addFile: () => void;
}

function FileExplorer({
  files,
  activeFileId,
  setActiveFileId,
  addFile,
}: FileExplorerProps) {
  return (
    <div
      style={{
        width: "200px",
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
          onClick={() => setActiveFileId(file.id)}
          style={{
            cursor: "pointer",
            padding: "8px",
            marginBottom: "4px",
            backgroundColor: file.id === activeFileId ? "#333" : "transparent",
            color: file.id === activeFileId ? "white" : "inherit",
          }}
        >
          {file.name}
        </div>
      ))}
    </div>
  );
}

export default FileExplorer;
