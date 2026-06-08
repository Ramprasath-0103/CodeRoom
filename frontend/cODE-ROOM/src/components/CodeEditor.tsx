import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { useRef, useState } from "react";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";

function CodeEditor() {
  const [value, setValue] = useState("");
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");

  function onSelect(lang) {
    setLanguage(lang);
    setValue(CODE_SNIPPETS[lang] ?? "");
  }

  function onMount(editor) {
    editorRef.current = editor;
    editor.focus();
  }

  return (
    <div style={{ display: "flex", gap: 16, height: "90vh" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
            onChange={(val) => setValue(val ?? "")}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <br />
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
}

export default CodeEditor;
