import { describe, expect, it } from "vitest";
import { getLanguageForFileName, getStarterSnippet, isRunnableLanguage } from "../utils/languages";
import { getUserColorIndex, USER_COLOR_COUNT } from "../utils/userColors";
import { isValidWorkspaceId, normalizeWorkspaceId } from "../utils/workspaceId";

describe("getLanguageForFileName", () => {
  it("maps common extensions to Monaco languages", () => {
    expect(getLanguageForFileName("main.js")).toBe("javascript");
    expect(getLanguageForFileName("app.tsx")).toBe("typescript");
    expect(getLanguageForFileName("script.py")).toBe("python");
    expect(getLanguageForFileName("solution.cpp")).toBe("cpp");
    expect(getLanguageForFileName("prog.c")).toBe("c");
    expect(getLanguageForFileName("Main.java")).toBe("java");
  });

  it("ignores extension case and uses the last extension", () => {
    expect(getLanguageForFileName("SOLUTION.CPP")).toBe("cpp");
    expect(getLanguageForFileName("archive.test.ts")).toBe("typescript");
  });

  it("falls back to plaintext", () => {
    expect(getLanguageForFileName("README")).toBe("plaintext");
    expect(getLanguageForFileName("data.xyz")).toBe("plaintext");
  });
});

describe("isRunnableLanguage", () => {
  it("allows every language with a starter snippet to run", () => {
    for (const fileName of ["a.c", "a.cpp", "a.cs", "a.go", "a.java", "a.js", "a.php", "a.py", "a.rb", "a.rs", "a.ts"]) {
      expect(isRunnableLanguage(getLanguageForFileName(fileName))).toBe(true);
      expect(getStarterSnippet(fileName)).not.toBe("");
    }
  });

  it("does not offer running markup or data files", () => {
    expect(isRunnableLanguage("markdown")).toBe(false);
    expect(isRunnableLanguage("json")).toBe(false);
    expect(getStarterSnippet("notes.md")).toBe("");
  });
});

describe("getUserColorIndex", () => {
  it("is deterministic and inside the palette", () => {
    for (const name of ["Alice", "Bob", "Guest-1234", "", "x"]) {
      const index = getUserColorIndex(name);
      expect(index).toBe(getUserColorIndex(name));
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(USER_COLOR_COUNT);
    }
  });
});

describe("workspace ids", () => {
  it("normalizes what people type", () => {
    expect(normalizeWorkspaceId("  ab12cd ")).toBe("AB12CD");
  });

  it("validates normalized ids", () => {
    expect(isValidWorkspaceId("AB12CD")).toBe(true);
    expect(isValidWorkspaceId("ab12cd")).toBe(false);
    expect(isValidWorkspaceId("AB 12")).toBe(false);
    expect(isValidWorkspaceId("")).toBe(false);
  });
});
