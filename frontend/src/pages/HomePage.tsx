import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, getErrorMessage } from "../api/httpClient";
import { createWorkspace, getWorkspace } from "../api/workspaceApi";
import { MAX_DISPLAY_NAME_LENGTH, useDisplayName } from "../hooks/useDisplayName";
import { readStorage, STORAGE_KEYS } from "../utils/storage";
import { isValidWorkspaceId, normalizeWorkspaceId } from "../utils/workspaceId";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useDisplayName();
  const [lastWorkspaceId] = useState(() => readStorage(STORAGE_KEYS.lastWorkspace));
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleCreate() {
    setIsBusy(true);
    setError(null);

    try {
      const workspace = await createWorkspace();
      navigate(`/workspace/${workspace.id}`);
    } catch (createError) {
      setError(getErrorMessage(createError));
      setIsBusy(false);
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    const workspaceId = normalizeWorkspaceId(joinId);

    if (!isValidWorkspaceId(workspaceId)) {
      setError("Workspace IDs contain only letters and numbers.");
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await getWorkspace(workspaceId);
      navigate(`/workspace/${workspaceId}`);
    } catch (joinError) {
      const isMissing = joinError instanceof ApiError && joinError.status === 404;
      setError(isMissing ? `Workspace ${workspaceId} was not found.` : getErrorMessage(joinError));
      setIsBusy(false);
    }
  }

  return (
    <main className="home">
      <div className="home-card">
        <h1>CodeRoom</h1>

        <label className="home-label" htmlFor="display-name">
          Your name
        </label>
        <input
          id="display-name"
          className="home-name-input"
          value={displayName}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          onChange={(event) => setDisplayName(event.target.value)}
        />

        <button className="primary home-create" onClick={handleCreate} disabled={isBusy}>
          Create Workspace
        </button>

        {lastWorkspaceId && (
          <>
            <hr className="home-divider" />
            <div className="home-label">Continue last workspace</div>
            <button onClick={() => navigate(`/workspace/${lastWorkspaceId}`)} disabled={isBusy}>
              {lastWorkspaceId}
            </button>
          </>
        )}

        <hr className="home-divider" />

        <form className="home-join-row" onSubmit={handleJoin}>
          <input
            aria-label="Workspace ID"
            placeholder="Enter workspace ID"
            value={joinId}
            onChange={(event) => setJoinId(event.target.value)}
          />
          <button type="submit" disabled={isBusy}>
            Join
          </button>
        </form>

        {error && (
          <p className="home-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
