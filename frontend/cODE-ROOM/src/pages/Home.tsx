import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

function Home() {
  const navigate = useNavigate();

  const lastWorkspace = localStorage.getItem("last-workspace");

  const [workspaceId, setWorkspaceId] = useState("");

  async function createWorkspace() {
    try {
      const response = await api.post("/workspace");

      navigate(`/workspace/${response.data.workspaceId}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create workspace");
    }
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

      {lastWorkspace && (
        <>
          <hr />

          <h3>Continue Last Workspace</h3>

          <button onClick={() => navigate(`/workspace/${lastWorkspace}`)}>
            {lastWorkspace}
          </button>
        </>
      )}

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
