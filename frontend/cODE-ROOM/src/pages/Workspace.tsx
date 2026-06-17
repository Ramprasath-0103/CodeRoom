import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import FileExplorer from "../components/FileExplorer";
import { socket } from "../socket";
import { useRef } from "react";

function Workspace() {
  const { workspaceId } = useParams();
  const isRemoteUpdate = useRef(false);
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem(`workspace-${workspaceId}`);

    if (saved) {
      return JSON.parse(saved);
    }

    return [
      {
        id: 1,
        name: "main.cpp",
        content: "",
      },
    ];
  });

  const [activeFileId, setActiveFileId] = useState(1);

  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("join-workspace", workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    socket.on("file-change", ({ fileId, content }) => {
      isRemoteUpdate.current = true;

      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, content } : file,
        ),
      );
    });

    return () => {
      socket.off("file-change");
    };
  }, []);

  useEffect(() => {
    socket.on("message", (msg) => {
      console.log("Received:", msg);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(`workspace-${workspaceId}`, JSON.stringify(files));
  }, [files, workspaceId]);

  const activeFile = files.find((file) => file.id === activeFileId);

  function handleEditorChange(value: string) {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === activeFileId ? { ...file, content: value } : file,
      ),
    );

    socket.emit("file-change", {
      workspaceId,
      fileId: activeFileId,
      content: value,
    });
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

  function testRoom() {
    socket.emit("message", {
      workspaceId,
      message: "hello",
    });
  }

  return (
    <div>
      <h1>Workspace : {workspaceId}</h1>

      <button onClick={testRoom}>Test Room</button>

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
