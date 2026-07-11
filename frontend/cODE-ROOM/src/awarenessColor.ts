export const PALETTE = [
  "#e57373",
  "#64b5f6",
  "#81c784",
  "#ffb74d",
  "#ba68c8",
  "#4dd0e1",
  "#f06292",
  "#a1887f",
];

export function colorIndexForUser(username: string): number {
  let hash = 0;

  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % PALETTE.length;
}
