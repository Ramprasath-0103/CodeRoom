import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { useRef, useEffect } from "react";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import { socket } from "../socket";
import { getYText } from "../yjs";
import { bindMonacoToYText } from "../yjsBinding";

interface CodeEditorProps {
  workspaceId: string;
  username: string;
  activeFileId: string;
  language: string;
  onLanguageChange: (lang: string) => void;

  cursorPositions: Record<string, any>;
}

function CodeEditor({
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
  const unbindYTextRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    return () => {
      unbindYTextRef.current?.();
    };
  }, []);

  function onSelect(lang: string) {
    onLanguageChange(lang);

    const ytext = getYText(activeFileIdRef.current);

    if (ytext.length === 0) {
      ytext.insert(0, CODE_SNIPPETS[lang] ?? "");
    }
  }

  function onMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.focus();

    const ytext = getYText(activeFileIdRef.current);
    unbindYTextRef.current = bindMonacoToYText(editor, ytext, () => {
      socket.emit("typing", {
        workspaceId,
        username,
        fileId: activeFileIdRef.current,
      });

      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", {
          workspaceId,
          username,
        });
      }, 1000);
    });

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
          defaultValue=""
          theme="vs-dark"
          onMount={onMount}
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
