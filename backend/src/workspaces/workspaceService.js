import { createInitialWorkspaceState } from "../collaboration/workspaceDocument.js";
import { HttpError } from "../errors/HttpError.js";
import { generateWorkspaceId, isValidWorkspaceId, normalizeWorkspaceId } from "./workspaceId.js";
import { findWorkspaceById, insertWorkspace, isDuplicateIdError } from "./workspaceRepository.js";

const MAX_ID_ATTEMPTS = 5;

export async function createWorkspace() {
  const initialState = createInitialWorkspaceState();

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
    try {
      return await insertWorkspace(generateWorkspaceId(), initialState);
    } catch (error) {
      if (!isDuplicateIdError(error)) {
        throw error;
      }
    }
  }

  throw new HttpError(503, "Could not allocate a workspace id, please try again");
}

export async function getWorkspace(rawId) {
  const id = normalizeWorkspaceId(rawId);

  if (!isValidWorkspaceId(id)) {
    throw new HttpError(400, "Workspace id must contain only letters and digits");
  }

  const workspace = await findWorkspaceById(id);

  if (!workspace) {
    throw new HttpError(404, "Workspace not found");
  }

  return workspace;
}
