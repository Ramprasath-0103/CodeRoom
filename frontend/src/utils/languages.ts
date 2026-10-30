const EXTENSION_LANGUAGES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  cs: "csharp",
  php: "php",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  h: "cpp",
  c: "c",
  go: "go",
  rs: "rust",
  rb: "ruby",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  sql: "sql",
};

const RUNNABLE_LANGUAGES = new Set([
  "c",
  "cpp",
  "csharp",
  "go",
  "java",
  "javascript",
  "php",
  "python",
  "ruby",
  "rust",
  "typescript",
]);

const STARTER_SNIPPETS: Record<string, string> = {
  javascript: `function greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
  typescript: `type Params = {\n\tname: string;\n};\n\nfunction greet(data: Params) {\n\tconsole.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "Alex" });\n`,
  python: `def greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex")\n`,
  java: `public class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello, World!");\n\t}\n}\n`,
  csharp: `using System;\n\nclass Program {\n\tstatic void Main() {\n\t\tConsole.WriteLine("Hello, World!");\n\t}\n}\n`,
  php: `<?php\n\n$name = "Alex";\necho "Hello, " . $name . "!";\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n\tcout << "Hello, World!" << endl;\n\treturn 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n\tprintf("Hello, World!\\n");\n\treturn 0;\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n}\n`,
  ruby: `def greet(name)\n\tputs "Hello, #{name}!"\nend\n\ngreet("Alex")\n`,
  rust: `fn main() {\n\tprintln!("Hello, World!");\n}\n`,
};

export function getLanguageForFileName(fileName: string): string {
  const extension = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  return EXTENSION_LANGUAGES[extension] ?? "plaintext";
}

export function isRunnableLanguage(language: string): boolean {
  return RUNNABLE_LANGUAGES.has(language);
}

export function getStarterSnippet(fileName: string): string {
  return STARTER_SNIPPETS[getLanguageForFileName(fileName)] ?? "";
}
