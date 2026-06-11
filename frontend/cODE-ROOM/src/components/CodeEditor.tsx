import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { useRef, useState } from "react";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function CodeEditor({ value, onChange }: CodeEditorProps) {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");

  function onSelect(lang: string) {
    setLanguage(lang);

    // Optional:
    // If the file is empty, load starter template.
    if (!value) {
      onChange(CODE_SNIPPETS[lang] ?? "");
    }
  }

  function onMount(editor: any) {
    editorRef.current = editor;
    editor.focus();
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        height: "90vh",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <LanguageSelector language={language} onSelect={onSelect} />
        </div>

        <div style={{ flex: 1 }}>
          <Editor
            height="90vh"
            language={language}
            value={value}
            theme="vs-dark"
            onMount={onMount}
            onChange={(val) => onChange(val ?? "")}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        <br />
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
}

export default CodeEditor;
