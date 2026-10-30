import { useMemo, useSyncExternalStore } from "react";
import { readPeers, type Awareness, type Peer } from "../collaboration/presence";

const MAX_ACTIVITY_ENTRIES = 20;

export interface ActivityEntry {
  id: number;
  message: string;
}

interface PresenceSnapshot {
  peers: Peer[];
  activity: ActivityEntry[];
}

interface AwarenessChange {
  removed: number[];
}

function createPresenceStore(awareness: Awareness) {
  const knownNames = new Map<number, string>();
  let nextActivityId = 1;
  let snapshot: PresenceSnapshot = { peers: readPeers(awareness), activity: [] };

  snapshot.peers.forEach((peer) => knownNames.set(peer.clientId, peer.user.name));

  return {
    subscribe(onChange: () => void) {
      const handleChange = ({ removed }: AwarenessChange) => {
        const peers = readPeers(awareness);
        const messages: string[] = [];

        peers.forEach((peer) => {
          if (!knownNames.has(peer.clientId) && !peer.isSelf) {
            messages.push(`${peer.user.name} joined`);
          }

          knownNames.set(peer.clientId, peer.user.name);
        });

        removed.forEach((clientId) => {
          const name = knownNames.get(clientId);

          if (name) {
            messages.push(`${name} left`);
            knownNames.delete(clientId);
          }
        });

        const newEntries = messages.map((message) => ({ id: nextActivityId++, message }));
        snapshot = {
          peers,
          activity: [...newEntries.reverse(), ...snapshot.activity].slice(0, MAX_ACTIVITY_ENTRIES),
        };
        onChange();
      };

      awareness.on("change", handleChange);
      return () => awareness.off("change", handleChange);
    },
    getSnapshot: () => snapshot,
  };
}

export function usePresence(awareness: Awareness): PresenceSnapshot {
  const store = useMemo(() => createPresenceStore(awareness), [awareness]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
