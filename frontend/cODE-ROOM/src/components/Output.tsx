import { useState } from "react";
import { executeCode } from "../executeApi";
import "./Output.css";

interface OutputProps {
  editorRef: React.RefObject<any>;
  language: string;
}

export default function Output({ editorRef, language }: OutputProps) {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    try {
      setIsLoading(true);
      setIsError(false);
      const result = await executeCode(language, sourceCode);
      const hasError = result.stderr || result.compile_output;
      setIsError(Boolean(hasError));
      setOutput(hasError || result.stdout || result.message || "");
    } catch (error) {
      console.log("Error executing code:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="output-panel">
      <div className="output-run-row">
        <button className="primary" onClick={runCode} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Code"}
        </button>
      </div>

      <div className={`output-box ${isError ? "error" : ""}`}>
        {output ? (
          <pre>{output}</pre>
        ) : (
          <span className="output-empty">Output will appear here.</span>
        )}
      </div>
    </div>
  );
}
