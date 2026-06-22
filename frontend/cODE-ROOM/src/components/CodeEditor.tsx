import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { useRef, useEffect } from "react";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import { socket } from "../socket";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  workspaceId: string;
  username: string;
  activeFileId: number;
  language: string;
  onLanguageChange: (lang: string) => void;

  cursorPositions: Record<string, any>;
}

function CodeEditor({
  value,
  onChange,
  workspaceId,
  username,
  activeFileId,
  language,
  onLanguageChange,
  cursorPositions,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const activeFileIdRef = useRef(activeFileId);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  function onSelect(lang: string) {
    onLanguageChange(lang);

    if (!value) {
      onChange(CODE_SNIPPETS[lang] ?? "");
    }
  }

  function onMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.focus();

    editor.onDidChangeCursorPosition((e: any) => {
      const currentFileId = activeFileIdRef.current;

      socket.emit("cursor-move", {
        workspaceId,
        username,
        fileId: currentFileId,
        position: {
          line: e.position.lineNumber,
          column: e.position.column,
        },
      });
    });
  }

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    const decorations: any[] = [];

    Object.entries(cursorPositions)
      .filter(
        ([user, data]: any) =>
          user !== username && data.fileId === activeFileId,
      )
      .forEach(([user, data]: any) => {
        decorations.push({
          range: new monacoRef.current.Range(
            data.line,
            data.column,
            data.line,
            data.column,
          ),

          options: {
            className: "remote-cursor",

            hoverMessage: {
              value: user,
            },
          },
        });
      });

    editorRef.current.deltaDecorations([], decorations);
  }, [cursorPositions, activeFileId, username]);

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
          key={activeFileId}
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
