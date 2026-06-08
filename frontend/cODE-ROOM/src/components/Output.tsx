import { useState } from "react";
import { executeCode } from "../api";

export default function Output({ editorRef, language }) {
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
      setOutput(result.run?.output || result.run?.stdout || "");
    } catch (error) {
      console.log("Error executing code:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <button
        onClick={runCode}
        style={{
          padding: "10px 20px",
          fontSize: "12px",
          backgroundColor: "rgba(21, 20, 20, 1)",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Run Code
      </button>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#201d1dff",
          borderRadius: "4px",
          minHeight: "90vh",
        }}
      >
        {isLoading ? (
          <p>Loading...</p>
        ) : isError ? (
          <p style={{ color: "red" }}>Error executing code.</p>
        ) : (
          <pre>{output}</pre>
        )}
      </div>
    </div>
  );
}
