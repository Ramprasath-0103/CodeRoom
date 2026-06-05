import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { useRef, useState } from "react";
import { CODE_SNIPPETS } from "../constants";

function CodeEditor() {
  const [value, setValue] = useState("");
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");

  function onSelect(lang) {
    setLanguage(lang);
    setValue(CODE_SNIPPETS[lang]);
  }

  function onMount(editor) {
    editorRef.current = editor;
    editor.focus();
  }

  return (
    <div>
      <LanguageSelector language={language} onSelect={onSelect} />
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        defaultValue={CODE_SNIPPETS[language]}
        theme="vs-dark"
        onMount={onMount}
        value={value}
        onChange={() => {
          setValue(value);
        }}
      />
    </div>
  );
}

export default CodeEditor;
