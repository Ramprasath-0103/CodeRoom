export const USER_COLOR_COUNT = 8;

export function getUserColorIndex(name: string): number {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % USER_COLOR_COUNT;
}

export function getUserColor(colorIndex: number): string {
  return `var(--user-color-${colorIndex % USER_COLOR_COUNT})`;
}
