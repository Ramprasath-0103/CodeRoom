import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import type * as Y from "yjs";
import { attachCollaborativeEditor } from "../collaboration/attachCollaborativeEditor";
import type { Awareness } from "../collaboration/presence";
import "../styles/remoteCursors.css";

interface CodeEditorProps {
  fileId: string;
  text: Y.Text;
  awareness: Awareness;
  language: string;
}

const EDITOR_OPTIONS = {
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
};

export default function CodeEditor({ fileId, text, awareness, language }: CodeEditorProps) {
  const detachRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      detachRef.current?.();
      detachRef.current = null;
    };
  }, []);

  const handleMount: OnMount = (codeEditor, monaco) => {
    detachRef.current?.();
    detachRef.current = attachCollaborativeEditor({ codeEditor, monaco, text, awareness, fileId });
    codeEditor.focus();
  };

  return (
    <Editor
      defaultValue=""
      language={language}
      theme="vs-dark"
      options={EDITOR_OPTIONS}
      onMount={handleMount}
      loading={<div className="editor-loading">Loading editor…</div>}
    />
  );
}
