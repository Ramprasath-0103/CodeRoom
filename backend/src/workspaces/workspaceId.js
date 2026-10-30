import { randomInt } from "node:crypto";

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ID_LENGTH = 8;
const ID_PATTERN = /^[A-Z0-9]{1,16}$/;

export function generateWorkspaceId() {
  return Array.from({ length: ID_LENGTH }, () => ID_ALPHABET[randomInt(ID_ALPHABET.length)]).join("");
}

export function normalizeWorkspaceId(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function isValidWorkspaceId(value) {
  return typeof value === "string" && ID_PATTERN.test(value);
}
