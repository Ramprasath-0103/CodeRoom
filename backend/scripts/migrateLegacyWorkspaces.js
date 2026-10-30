import * as Y from "yjs";
import { addFile, FILES_KEY } from "../src/collaboration/workspaceDocument.js";
import { prisma } from "../src/database/prismaClient.js";

async function loadLegacyFiles() {
  const [{ hasFileTable }] = await prisma.$queryRaw`
    SELECT to_regclass('public."File"') IS NOT NULL AS "hasFileTable"
  `;

  if (!hasFileTable) {
    return [];
  }

  return prisma.$queryRaw`SELECT "id", "name", "workspaceId" FROM "File" ORDER BY "name"`;
}

function buildMigratedState(legacyState, legacyFiles) {
  const legacyDoc = new Y.Doc();

  if (legacyState) {
    Y.applyUpdate(legacyDoc, new Uint8Array(legacyState));
  }

  if (legacyDoc.getMap(FILES_KEY).size > 0 || legacyFiles.length === 0) {
    return null;
  }

  const migratedDoc = new Y.Doc();

  legacyFiles.forEach((file, index) => {
    addFile(migratedDoc, {
      id: file.id,
      name: file.name,
      content: legacyDoc.getText(file.id).toString(),
      createdAt: index,
    });
  });

  return Y.encodeStateAsUpdate(migratedDoc);
}

async function migrateLegacyWorkspaces() {
  const legacyFiles = await loadLegacyFiles();
  const filesByWorkspace = Map.groupBy(legacyFiles, (file) => file.workspaceId);
  const workspaces = await prisma.$queryRaw`SELECT "id", "yjsState" FROM "Workspace"`;
  let migratedCount = 0;

  for (const workspace of workspaces) {
    const migratedState = buildMigratedState(
      workspace.yjsState,
      filesByWorkspace.get(workspace.id) ?? [],
    );

    if (!migratedState) {
      continue;
    }

    await prisma.$executeRaw`
      UPDATE "Workspace" SET "yjsState" = ${Buffer.from(migratedState)} WHERE "id" = ${workspace.id}
    `;
    migratedCount += 1;
  }

  console.log(`Migrated ${migratedCount} of ${workspaces.length} workspaces`);
}

try {
  await migrateLegacyWorkspaces();
} catch (error) {
  console.error("Legacy workspace migration failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
