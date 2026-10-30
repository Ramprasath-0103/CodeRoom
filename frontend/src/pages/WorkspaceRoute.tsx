import { Navigate, useParams } from "react-router-dom";
import StatusScreen from "../components/StatusScreen";
import { isValidWorkspaceId, normalizeWorkspaceId } from "../utils/workspaceId";
import WorkspacePage from "./WorkspacePage";

export default function WorkspaceRoute() {
  const { workspaceId = "" } = useParams();
  const normalizedId = normalizeWorkspaceId(workspaceId);

  if (!isValidWorkspaceId(normalizedId)) {
    return <StatusScreen message="That workspace link is not valid." showHomeLink />;
  }

  if (normalizedId !== workspaceId) {
    return <Navigate to={`/workspace/${normalizedId}`} replace />;
  }

  return <WorkspacePage key={normalizedId} workspaceId={normalizedId} />;
}
