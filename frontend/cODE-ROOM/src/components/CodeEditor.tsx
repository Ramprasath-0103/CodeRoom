import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { useRef, useState } from "react";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import { socket } from "../socket";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  workspaceId: string;
  username: string;
  activeFileId: number;
}

function CodeEditor({
  value,
  onChange,
  workspaceId,
  username,
  activeFileId,
}: CodeEditorProps) {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");

  function onSelect(lang: string) {
    setLanguage(lang);

    if (!value) {
      onChange(CODE_SNIPPETS[lang] ?? "");
    }
  }

  function onMount(editor: any) {
    editorRef.current = editor;
    editor.focus();

    editor.onDidChangeCursorPosition((e: any) => {
      socket.emit("cursor-move", {
        workspaceId,
        username,
        fileId: activeFileId,
        position: {
          line: e.position.lineNumber,
          column: e.position.column,
        },
      });
      console.log("CURSOR", e.position.lineNumber, e.position.column);
    });
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
        <LanguageSelector language={language} onSelect={onSelect} />

        <Editor
          height="90vh"
          language={language}
          value={value}
          theme="vs-dark"
          onMount={onMount}
          onChange={(val) => onChange(val ?? "")}
        />
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
