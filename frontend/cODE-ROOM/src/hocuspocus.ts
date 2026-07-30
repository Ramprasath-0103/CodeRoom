import { HocuspocusProvider } from "@hocuspocus/provider";

// Each workspace gets its own provider, and the provider owns its own Y.Doc
// (accessible via `provider.document`). Never share a Y.Doc across workspaces:
// the provider syncs the whole doc to its named server document, so a shared
// doc would bleed one workspace's file contents into another.
export function connectYjsProvider(workspaceId: string) {
  return new HocuspocusProvider({
    url: "ws://localhost:1234",
    name: workspaceId,
  });
}
