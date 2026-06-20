import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import CodeEditor from "../components/CodeEditor";
import FileExplorer from "../components/FileExplorer";
import { socket } from "../socket";

function Workspace() {
  const { workspaceId } = useParams();

  const username = useRef(
    localStorage.getItem("username") ||
      `User-${Math.floor(Math.random() * 1000)}`,
  ).current;

  const isRemoteUpdate = useRef(false);
  const typingTimeout = useRef<any>(null);

  const [typingUser, setTypingUser] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const [cursorPositions, setCursorPositions] = useState<Record<string, any>>(
    {},
  );

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

  const activeFileIdRef = useRef(activeFileId);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    localStorage.setItem("username", username);
  }, [username]);

  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("join-workspace", {
      workspaceId,
      username,
    });
  }, [workspaceId, username]);

  // Users
  useEffect(() => {
    socket.on("users-update", (users) => {
      setUsers(users);
    });

    return () => {
      socket.off("users-update");
    };
  }, []);

  // Cursor Sharing
  useEffect(() => {
    socket.on("cursor-move", ({ username, position }) => {
      setCursorPositions((prev) => ({
        ...prev,
        [username]: position,
      }));
    });

    return () => {
      socket.off("cursor-move");
    };
  }, []);

  // Typing
  useEffect(() => {
    socket.on("typing", ({ username, fileId }) => {
      if (fileId !== activeFileIdRef.current) {
        return;
      }

      setTypingUser(username);
    });

    socket.on("stop-typing", () => {
      setTypingUser("");
    });

    return () => {
      socket.off("typing");
      socket.off("stop-typing");
    };
  }, []);

  // File Sync
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
    socket.on("create-file", ({ file }) => {
      setFiles((prev) => [...prev, file]);
    });

    socket.on("rename-file", ({ fileId, newName }) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId
            ? {
                ...file,
                name: newName,
              }
            : file,
        ),
      );
    });

    socket.on("delete-file", ({ fileId }) => {
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
    });

    return () => {
      socket.off("create-file");
      socket.off("rename-file");
      socket.off("delete-file");
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

    socket.emit("typing", {
      workspaceId,
      username,
      fileId: activeFileId,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop-typing", {
        workspaceId,
      });
    }, 1000);

    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === activeFileId
          ? {
              ...file,
              content: value,
            }
          : file,
      ),
    );

    socket.emit("file-change", {
      workspaceId,
      fileId: activeFileId,
      content: value,
    });
  }

  function renameFile(fileId: number) {
    const newName = prompt("Enter new file name");

    if (!newName) return;

    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              name: newName,
            }
          : file,
      ),
    );

    socket.emit("rename-file", {
      workspaceId,
      fileId,
      newName,
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

    socket.emit("create-file", {
      workspaceId,
      file: newFile,
    });

    setActiveFileId(newFile.id);
  }

  function deleteFile(fileId: number) {
    const remainingFiles = files.filter((file) => file.id !== fileId);

    setFiles(remainingFiles);

    socket.emit("delete-file", {
      workspaceId,
      fileId,
    });

    if (activeFileId === fileId && remainingFiles.length > 0) {
      setActiveFileId(remainingFiles[0].id);
    }
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

      <h3>Online Users ({users.length})</h3>

      <ul>
        {users.map((user) => (
          <li key={user.socketId}>
            🟢 {user.username}
            {cursorPositions[user.username] && (
              <>
                {" "}
                (L
                {cursorPositions[user.username].line}
                :C
                {cursorPositions[user.username].column})
              </>
            )}
          </li>
        ))}
      </ul>

      {typingUser && <p>✍️ {typingUser} is typing...</p>}

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
          renameFile={renameFile}
          deleteFile={deleteFile}
        />

        <div style={{ flex: 1 }}>
          <CodeEditor
            value={activeFile?.content || ""}
            onChange={handleEditorChange}
            workspaceId={workspaceId || ""}
            username={username}
          />
        </div>
      </div>
    </div>
  );
}

export default Workspace;
