import { requestJson } from "./httpClient";

export interface ExecutionResult {
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: string | null;
  memory: number | null;
}

export function runCode(language: string, sourceCode: string): Promise<ExecutionResult> {
  return requestJson<ExecutionResult>("/execute", {
    method: "POST",
    body: JSON.stringify({ language, sourceCode }),
  });
}
