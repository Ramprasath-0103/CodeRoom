import { useParams } from "react-router-dom";
import { useState } from "react";
import CodeEditor from "../components/CodeEditor";
import FileExplorer from "../components/FileExplorer";

function Workspace() {
  const { workspaceId } = useParams();

  const [files, setFiles] = useState([
    {
      id: 1,
      name: "main.cpp",
      content: "",
    },
  ]);

  const [activeFileId, setActiveFileId] = useState(1);

  const activeFile = files.find((file) => file.id === activeFileId);

  function handleEditorChange(value: string) {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === activeFileId ? { ...file, content: value } : file,
      ),
    );
  }

  function addFile() {
    const fileName = prompt("Enter file name");

    if (!fileName) return;

    const newFile = {
      id: Date.now(),
      name: fileName,
      content: "",
    };

    setFiles((prev) => [...prev, newFile]);

    setActiveFileId(newFile.id);
  }

  return (
    <div>
      <h1>Workspace : {workspaceId}</h1>
      <div
        style={{
          display: "flex",
        }}
      >
        <FileExplorer
          files={files}
          activeFileId={activeFileId}
          setActiveFileId={setActiveFileId}
          addFile={addFile}
        />

        <div style={{ flex: 1 }}>
          <CodeEditor
            value={activeFile?.content || ""}
            onChange={handleEditorChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Workspace;
