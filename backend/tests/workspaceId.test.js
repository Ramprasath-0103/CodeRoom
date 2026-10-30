import { describe, expect, it } from "vitest";
import {
  generateWorkspaceId,
  isValidWorkspaceId,
  normalizeWorkspaceId,
} from "../src/workspaces/workspaceId.js";

describe("generateWorkspaceId", () => {
  it("creates 8 character ids without ambiguous characters", () => {
    for (let index = 0; index < 200; index += 1) {
      expect(generateWorkspaceId()).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    }
  });

  it("does not repeat across many generations", () => {
    const ids = new Set(Array.from({ length: 1000 }, generateWorkspaceId));
    expect(ids.size).toBe(1000);
  });
});

describe("normalizeWorkspaceId", () => {
  it("trims and uppercases user input", () => {
    expect(normalizeWorkspaceId("  ab12cd ")).toBe("AB12CD");
  });

  it("returns an empty string for non-string input", () => {
    expect(normalizeWorkspaceId(undefined)).toBe("");
    expect(normalizeWorkspaceId(42)).toBe("");
  });
});

describe("isValidWorkspaceId", () => {
  it("accepts new and legacy ids", () => {
    expect(isValidWorkspaceId("K7QMZ2XP")).toBe(true);
    expect(isValidWorkspaceId("AB12CD")).toBe(true);
  });

  it("rejects empty, lowercase and symbol ids", () => {
    expect(isValidWorkspaceId("")).toBe(false);
    expect(isValidWorkspaceId("ab12cd")).toBe(false);
    expect(isValidWorkspaceId("AB-12")).toBe(false);
    expect(isValidWorkspaceId("../etc")).toBe(false);
  });
});
