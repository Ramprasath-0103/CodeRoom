// Maps a file extension to a Monaco language id.
const EXT_TO_LANGUAGE: Record<string, string> = {
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

export function languageFromFilename(name?: string): string {
  if (!name) return "plaintext";

  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  return EXT_TO_LANGUAGE[ext] ?? "plaintext";
}

export const CODE_SNIPPETS: Record<string, string> = {
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
};
