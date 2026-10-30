import { useMemo, useSyncExternalStore } from "react";
import * as Y from "yjs";
import { getFilesMap, listFiles, type WorkspaceFile } from "../collaboration/workspaceDocument";

function createFilesStore(doc: Y.Doc) {
  let snapshot = listFiles(doc);

  return {
    subscribe(onChange: () => void) {
      const files = getFilesMap(doc);

      const handleChange = (events: Y.YEvent<Y.AbstractType<unknown>>[]) => {
        if (events.every((event) => event.target instanceof Y.Text)) {
          return;
        }

        snapshot = listFiles(doc);
        onChange();
      };

      files.observeDeep(handleChange);
      return () => files.unobserveDeep(handleChange);
    },
    getSnapshot: () => snapshot,
  };
}

export function useWorkspaceFiles(doc: Y.Doc): WorkspaceFile[] {
  const store = useMemo(() => createFilesStore(doc), [doc]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
