import { useState } from "react";
import { runCode, type ExecutionResult } from "../api/executionApi";
import { getErrorMessage } from "../api/httpClient";
import { isRunnableLanguage } from "../utils/languages";
import "./OutputPanel.css";

interface OutputPanelProps {
  language: string;
  readSourceCode: () => string;
}

type RunState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "finished"; result: ExecutionResult }
  | { phase: "failed"; message: string };

function describeResult(result: ExecutionResult): { text: string; isError: boolean } {
  if (result.compileOutput) {
    return { text: result.compileOutput, isError: true };
  }

  if (result.stderr) {
    return { text: [result.stdout, result.stderr].filter(Boolean).join("\n"), isError: true };
  }

  return { text: result.stdout || result.message || "Program finished with no output.", isError: false };
}

function OutputBody({ state }: { state: RunState }) {
  if (state.phase === "idle") {
    return <span className="output-empty">Output will appear here.</span>;
  }

  if (state.phase === "running") {
    return <span className="output-empty">Running…</span>;
  }

  if (state.phase === "failed") {
    return <pre className="output-error">{state.message}</pre>;
  }

  const { text, isError } = describeResult(state.result);
  const timing = state.result.time ? ` · ${state.result.time}s` : "";

  return (
    <>
      <p className="output-status">
        {state.result.status}
        {timing}
      </p>
      <pre className={isError ? "output-error" : undefined}>{text}</pre>
    </>
  );
}

export default function OutputPanel({ language, readSourceCode }: OutputPanelProps) {
  const [runState, setRunState] = useState<RunState>({ phase: "idle" });
  const canRun = isRunnableLanguage(language);

  async function handleRun() {
    const sourceCode = readSourceCode();

    if (!sourceCode.trim()) {
      setRunState({ phase: "failed", message: "This file is empty, write some code first." });
      return;
    }

    setRunState({ phase: "running" });

    try {
      setRunState({ phase: "finished", result: await runCode(language, sourceCode) });
    } catch (error) {
      setRunState({ phase: "failed", message: getErrorMessage(error) });
    }
  }

  return (
    <div className="output-panel">
      <div className="output-toolbar">
        <button
          className="primary"
          onClick={handleRun}
          disabled={!canRun || runState.phase === "running"}
          title={canRun ? undefined : `Running ${language} files is not supported`}
        >
          {runState.phase === "running" ? "Running…" : "Run Code"}
        </button>
        {!canRun && <span className="output-hint">{language} files can't be run</span>}
      </div>

      <div className="output-box">
        <OutputBody state={runState} />
      </div>
    </div>
  );
}
