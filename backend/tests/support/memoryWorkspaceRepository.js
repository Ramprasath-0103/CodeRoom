export const storedWorkspaces = new Map();

function toSummary({ id, createdAt, updatedAt }) {
  return { id, createdAt, updatedAt };
}

export function resetStoredWorkspaces() {
  storedWorkspaces.clear();
}

export function isDuplicateIdError(error) {
  return error?.code === "P2002";
}

export async function insertWorkspace(id, state) {
  if (storedWorkspaces.has(id)) {
    throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
  }

  const now = new Date();
  const workspace = { id, state: new Uint8Array(state), createdAt: now, updatedAt: now };
  storedWorkspaces.set(id, workspace);
  return toSummary(workspace);
}

export async function findWorkspaceById(id) {
  const workspace = storedWorkspaces.get(id);
  return workspace ? toSummary(workspace) : null;
}

export async function workspaceExists(id) {
  return storedWorkspaces.has(id);
}

export async function loadWorkspaceState(id) {
  return storedWorkspaces.get(id)?.state ?? null;
}

export async function saveWorkspaceState(id, state) {
  const workspace = storedWorkspaces.get(id);

  if (!workspace) {
    throw new Error(`Workspace ${id} not found`);
  }

  workspace.state = new Uint8Array(state);
  workspace.updatedAt = new Date();
}
