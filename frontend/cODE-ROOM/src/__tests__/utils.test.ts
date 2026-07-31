import { describe, it, expect } from "vitest";
import { languageFromFilename, CODE_SNIPPETS } from "../constants";
import { colorIndexForUser, PALETTE } from "../awarenessColor";

describe("languageFromFilename", () => {
  it("maps common extensions to Monaco language ids", () => {
    expect(languageFromFilename("main.js")).toBe("javascript");
    expect(languageFromFilename("app.tsx")).toBe("typescript");
    expect(languageFromFilename("script.py")).toBe("python");
    expect(languageFromFilename("solution.cpp")).toBe("cpp");
    expect(languageFromFilename("header.h")).toBe("cpp");
    expect(languageFromFilename("prog.c")).toBe("c");
    expect(languageFromFilename("Main.java")).toBe("java");
  });

  it("is case-insensitive on the extension", () => {
    expect(languageFromFilename("SOLUTION.CPP")).toBe("cpp");
    expect(languageFromFilename("Script.PY")).toBe("python");
  });

  it("uses the last extension for multi-dotted names", () => {
    expect(languageFromFilename("archive.test.ts")).toBe("typescript");
  });

  it("falls back to plaintext for unknown or missing extensions", () => {
    expect(languageFromFilename("README")).toBe("plaintext");
    expect(languageFromFilename("data.xyz")).toBe("plaintext");
    expect(languageFromFilename(undefined)).toBe("plaintext");
    expect(languageFromFilename("")).toBe("plaintext");
  });

  it("has a starter snippet for every language it seeds", () => {
    // Every derived language that has a snippet must be a non-empty string.
    for (const lang of Object.keys(CODE_SNIPPETS)) {
      expect(CODE_SNIPPETS[lang].length).toBeGreaterThan(0);
    }
  });
});

describe("colorIndexForUser", () => {
  it("returns a valid palette index", () => {
    for (const name of ["Alice", "Bob", "User-42", "", "x"]) {
      const idx = colorIndexForUser(name);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(PALETTE.length);
      expect(Number.isInteger(idx)).toBe(true);
    }
  });

  it("is deterministic for the same username", () => {
    expect(colorIndexForUser("Ramprasath")).toBe(colorIndexForUser("Ramprasath"));
  });
});
