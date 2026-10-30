import { prisma } from "../database/prismaClient.js";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

const workspaceSummary = {
  id: true,
  createdAt: true,
  updatedAt: true,
};

export function isDuplicateIdError(error) {
  return error?.code === UNIQUE_CONSTRAINT_VIOLATION;
}

export function insertWorkspace(id, state) {
  return prisma.workspace.create({
    data: { id, yjsState: Buffer.from(state) },
    select: workspaceSummary,
  });
}

export function findWorkspaceById(id) {
  return prisma.workspace.findUnique({
    where: { id },
    select: workspaceSummary,
  });
}

export async function workspaceExists(id) {
  const count = await prisma.workspace.count({ where: { id } });
  return count > 0;
}

export async function loadWorkspaceState(id) {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { yjsState: true },
  });

  return workspace?.yjsState ? new Uint8Array(workspace.yjsState) : null;
}

export async function saveWorkspaceState(id, state) {
  await prisma.workspace.update({
    where: { id },
    data: { yjsState: Buffer.from(state) },
  });
}
