import { requestJson } from "./httpClient";

export interface WorkspaceSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function createWorkspace(): Promise<WorkspaceSummary> {
  return requestJson<WorkspaceSummary>("/workspaces", { method: "POST" });
}

export function getWorkspace(workspaceId: string): Promise<WorkspaceSummary> {
  return requestJson<WorkspaceSummary>(`/workspaces/${encodeURIComponent(workspaceId)}`);
}
