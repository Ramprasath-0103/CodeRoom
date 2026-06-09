import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const [workspaceId, setWorkspaceId] = useState("");

  function generateWorkspaceId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function createWorkspace() {
    const id = generateWorkspaceId();
    navigate(`/workspace/${id}`);
  }

  function joinWorkspace() {
    const trimmedId = workspaceId.trim();

    if (!trimmedId) {
      return;
    }

    navigate(`/workspace/${trimmedId}`);
  }

  return (
    <div>
      <h1>CodeCollab</h1>

      <button onClick={createWorkspace}>Create Workspace</button>

      <hr />

      <input
        type="text"
        placeholder="Enter Workspace ID"
        value={workspaceId}
        onChange={(e) => setWorkspaceId(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            joinWorkspace();
          }
        }}
      />

      <button onClick={joinWorkspace}>Join Workspace</button>
    </div>
  );
}

export default Home;
