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

  const [notifications, setNotifications] = useState<string[]>([]);

  const isRemoteUpdate = useRef(false);
  const typingTimeout = useRef<any>(null);

  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});
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

  useEffect(() => {
    socket.on("user-joined", (username) => {
      setNotifications((prev) => [`${username} joined`, ...prev]);
    });

    socket.on("user-left", (username) => {
      setNotifications((prev) => [`${username} left`, ...prev]);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

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
    socket.on("cursor-move", ({ username, fileId, position }) => {
      setCursorPositions((prev) => ({
        ...prev,
        [username]: {
          fileId,
          line: position.line,
          column: position.column,
        },
      }));
    });

    return () => {
      socket.off("cursor-move");
    };
  }, []);

  // Typing
  useEffect(() => {
    socket.on("typing", ({ username, fileId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [username]: {
          fileId,
          timestamp: Date.now(),
        },
      }));
    });

    socket.on("stop-typing", ({ username }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };

        delete copy[username];

        return copy;
      });
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
        username,
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
                [
                {files.find(
                  (f) => f.id === cursorPositions[user.username].fileId,
                )?.name || "Unknown"}
                ] (L
                {cursorPositions[user.username].line}
                :C
                {cursorPositions[user.username].column})
              </>
            )}
          </li>
        ))}
      </ul>

      <h3>Activity</h3>

      <ul>
        {notifications.slice(0, 5).map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>

      <h3>Typing</h3>

      <ul>
        {Object.entries(typingUsers).map(([username, data]: any) => (
          <li key={username}>
            ✍️ {username} typing in{" "}
            {files.find((f) => f.id === data.fileId)?.name || "Unknown"}
          </li>
        ))}
      </ul>

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
            activeFileId={activeFileId}
          />
        </div>
      </div>
    </div>
  );
}

export default Workspace;
