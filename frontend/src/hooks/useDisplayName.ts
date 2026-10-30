import { useCallback, useState } from "react";
import { readStorage, STORAGE_KEYS, writeStorage } from "../utils/storage";

export const MAX_DISPLAY_NAME_LENGTH = 24;

function createGuestName(): string {
  return `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
}

function loadDisplayName(): string {
  const storedName = readStorage(STORAGE_KEYS.displayName)?.trim();

  if (storedName) {
    return storedName.slice(0, MAX_DISPLAY_NAME_LENGTH);
  }

  const guestName = createGuestName();
  writeStorage(STORAGE_KEYS.displayName, guestName);
  return guestName;
}

export function useDisplayName(): [string, (name: string) => void] {
  const [displayName, setDisplayNameState] = useState(loadDisplayName);

  const setDisplayName = useCallback((name: string) => {
    const limitedName = name.slice(0, MAX_DISPLAY_NAME_LENGTH);
    setDisplayNameState(limitedName);

    if (limitedName.trim()) {
      writeStorage(STORAGE_KEYS.displayName, limitedName.trim());
    }
  }, []);

  return [displayName, setDisplayName];
}

export function toEffectiveName(displayName: string): string {
  return displayName.trim() || "Guest";
}
