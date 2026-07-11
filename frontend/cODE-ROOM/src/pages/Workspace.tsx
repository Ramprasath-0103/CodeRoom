import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import CodeEditor from "../components/CodeEditor";
import FileExplorer from "../components/FileExplorer";
import { socket } from "../socket";
import { api, createFile, renameFileApi } from "../api";
import { deleteFileApi } from "../api";
import { connectYjsProvider } from "../hocuspocus";
import { colorIndexForUser, PALETTE } from "../awarenessColor";
import { languageFromFilename } from "../constants";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import "./Workspace.css";

function Workspace() {
  const { workspaceId } = useParams();
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const username = useRef(
    localStorage.getItem("username") ||
      `User-${Math.floor(Math.random() * 1000)}`,
  ).current;

  const [notifications, setNotifications] = useState<string[]>([]);

  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<any[]>([]);

  const [cursorPositions, setCursorPositions] = useState<Record<string, any>>(
    {},
  );

  interface File {
    id: string;
    name: string;
    content: string;
    language: string;
  }

  const [files, setFiles] = useState<File[]>([]);

  const [activeFileId, setActiveFileId] = useState<string>("");

  const [loading, setLoading] = useState(true);

  const [notFound, setNotFound] = useState(false);

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
    if (workspaceId) {
      localStorage.setItem("last-workspace", workspaceId);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("join-workspace", {
      workspaceId,
      username,
    });

    const provider = connectYjsProvider(workspaceId);
    providerRef.current = provider;

    const awareness = provider.awareness;

    awareness?.setLocalStateField("user", {
      name: username,
      colorIndex: colorIndexForUser(username),
    });

    function updateCursors() {
      const next: Record<string, any> = {};

      awareness?.getStates().forEach((state: any, clientId: number) => {
        if (clientId === awareness.clientID) return;
        if (!state.user?.name) return;

        next[state.user.name] = {
          fileId: state.cursor?.fileId,
          line: state.cursor?.line,
          column: state.cursor?.column,
          colorIndex: state.user.colorIndex,
          selection: state.selection,
        };
      });

      setCursorPositions(next);
    }

    awareness?.on("change", updateCursors);

    return () => {
      awareness?.off("change", updateCursors);
      provider.destroy();
      providerRef.current = null;
    };
  }, [workspaceId, username]);

  useEffect(() => {
    if (!workspaceId || !activeFileId) return;

    localStorage.setItem(`active-file-${workspaceId}`, activeFileId);
  }, [workspaceId, activeFileId]);

  // Users
  useEffect(() => {
    socket.on("users-update", (users) => {
      setUsers(users);
    });

    return () => {
      socket.off("users-update");
    };
  }, []);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const response = await api.get(`/workspace/${workspaceId}`);

        setFiles(response.data.files);

        const savedActiveFile = localStorage.getItem(
          `active-file-${workspaceId}`,
        );

        const fileExists = response.data.files.some(
          (file: any) => file.id === savedActiveFile,
        );

        if (fileExists) {
          setActiveFileId(savedActiveFile!);
        } else if (response.data.files.length > 0) {
          setActiveFileId(response.data.files[0].id);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          setNotFound(true);
        }

        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

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

  const activeFile = files.find((file) => file.id === activeFileId);
  const activeLanguage = languageFromFilename(activeFile?.name);

  async function renameFile(fileId: string) {
    const newName = prompt("Enter new file name");

    if (!newName) return;

    try {
      console.log("Sending rename request");

      await renameFileApi(fileId, newName);

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
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      }

      console.error(error);
    }
  }

  async function addFile() {
    const fileName = prompt("Enter file name");

    if (!fileName) return;

    try {
      const newFile = await createFile(workspaceId!, fileName);

      setFiles((prev) => [...prev, newFile]);

      socket.emit("create-file", {
        workspaceId,
        file: newFile,
      });

      setActiveFileId(newFile.id);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      }

      console.error(error);
    }
  }

  async function deleteFile(fileId: string) {
    try {
      await deleteFileApi(fileId);

      const remainingFiles = files.filter((file) => file.id !== fileId);

      setFiles(remainingFiles);

      socket.emit("delete-file", {
        workspaceId,
        fileId,
      });

      if (remainingFiles.length > 0) setActiveFileId(remainingFiles[0].id);
      else setActiveFileId("");
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      }

      console.error(error);
    }
  }

  if (loading) {
    return <div className="workspace-status">Loading workspace...</div>;
  }

  if (notFound) {
    return <div className="workspace-status">Workspace not found.</div>;
  }

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-title">
          <h1>CodeCollab</h1>
          <span className="workspace-id">{workspaceId}</span>
        </div>

        <div className="presence">
          {users.map((user) => (
            <div className="presence-user" key={user.socketId}>
              <span
                className="dot"
                style={{
                  background: PALETTE[colorIndexForUser(user.username)],
                }}
              />
              {user.username}
              {cursorPositions[user.username]?.line != null && (
                <span>
                  {" "}
                  · {files.find(
                    (f) => f.id === cursorPositions[user.username].fileId,
                  )?.name || "?"}{" "}
                  L{cursorPositions[user.username].line}:
                  {cursorPositions[user.username].column}
                </span>
              )}
            </div>
          ))}
        </div>
      </header>

      <div className="workspace-body">
        <FileExplorer
          files={files}
          activeFileId={activeFileId}
          setActiveFileId={setActiveFileId}
          addFile={addFile}
          renameFile={renameFile}
          deleteFile={deleteFile}
        />

        <div className="workspace-main">
          <CodeEditor
            providerRef={providerRef}
            workspaceId={workspaceId || ""}
            username={username}
            activeFileId={activeFileId}
            language={activeLanguage}
            cursorPositions={cursorPositions}
          />
        </div>

        <aside className="activity-panel">
          <section>
            <h3>Activity</h3>
            {notifications.length === 0 ? (
              <p className="activity-empty">No activity yet.</p>
            ) : (
              <ul>
                {notifications.slice(0, 5).map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>Typing</h3>
            {Object.keys(typingUsers).length === 0 ? (
              <p className="activity-empty">No one is typing.</p>
            ) : (
              <ul>
                {Object.entries(typingUsers).map(([username, data]: any) => (
                  <li key={username}>
                    {username} in{" "}
                    {files.find((f) => f.id === data.fileId)?.name || "?"}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Workspace;
