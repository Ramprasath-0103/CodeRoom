import type { Awareness } from "./presence";

const TYPING_TIMEOUT_MS = 1500;

export interface TypingIndicator {
  markTyping(): void;
  destroy(): void;
}

export function createTypingIndicator(awareness: Awareness): TypingIndicator {
  let isTyping = false;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const setTyping = (value: boolean) => {
    if (isTyping !== value) {
      isTyping = value;
      awareness.setLocalStateField("isTyping", value);
    }
  };

  return {
    markTyping() {
      setTyping(true);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setTyping(false), TYPING_TIMEOUT_MS);
    },
    destroy() {
      clearTimeout(resetTimer);
      setTyping(false);
    },
  };
}
