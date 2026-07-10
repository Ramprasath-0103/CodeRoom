import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { useRef, useEffect } from "react";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import { socket } from "../socket";
import { getYText } from "../yjs";
import { bindMonacoToYText } from "../yjsBinding";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import "../awareness.css";

interface CodeEditorProps {
  providerRef: React.RefObject<HocuspocusProvider | null>;
  workspaceId: string;
  username: string;
  activeFileId: string;
  language: string;
  onLanguageChange: (lang: string) => void;

  cursorPositions: Record<string, any>;
}

function CodeEditor({
  providerRef,
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
  const decorationIdsRef = useRef<string[]>([]);

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
      providerRef.current?.awareness?.setLocalStateField("cursor", {
        fileId: activeFileIdRef.current,
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    editor.onDidChangeCursorSelection((e: any) => {
      const sel = e.selection;

      providerRef.current?.awareness?.setLocalStateField(
        "selection",
        sel.isEmpty()
          ? null
          : {
              fileId: activeFileIdRef.current,
              startLine: sel.startLineNumber,
              startColumn: sel.startColumn,
              endLine: sel.endLineNumber,
              endColumn: sel.endColumn,
            },
      );
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
        if (data.line == null || data.column == null) return;

        decorations.push({
          range: new monacoRef.current.Range(
            data.line,
            data.column,
            data.line,
            data.column,
          ),

          options: {
            className: `remote-cursor-${data.colorIndex ?? 0}`,

            hoverMessage: {
              value: user,
            },
          },
        });

        if (data.selection) {
          decorations.push({
            range: new monacoRef.current.Range(
              data.selection.startLine,
              data.selection.startColumn,
              data.selection.endLine,
              data.selection.endColumn,
            ),

            options: {
              className: `remote-selection-${data.colorIndex ?? 0}`,
            },
          });
        }
      });

    decorationIdsRef.current = editorRef.current.deltaDecorations(
      decorationIdsRef.current,
      decorations,
    );
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
