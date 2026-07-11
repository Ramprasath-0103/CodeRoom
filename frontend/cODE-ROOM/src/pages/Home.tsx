import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "./Home.css";

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
    <div className="home">
      <div className="home-card">
        <h1>CodeCollab</h1>

        <button className="primary" onClick={createWorkspace}>
          Create Workspace
        </button>

        {lastWorkspace && (
          <>
            <hr className="home-divider" />

            <div className="home-section-label">Continue Last Workspace</div>

            <button onClick={() => navigate(`/workspace/${lastWorkspace}`)}>
              {lastWorkspace}
            </button>
          </>
        )}

        <hr className="home-divider" />

        <div className="home-join-row">
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

          <button onClick={joinWorkspace}>Join</button>
        </div>
      </div>
    </div>
  );
}

export default Home;
