import Editor from "@monaco-editor/react";
import { useRef, useEffect } from "react";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import { socket } from "../socket";
import { getYText } from "../yjs";
import { bindMonacoToYText } from "../yjsBinding";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import "../awareness.css";
import "./CodeEditor.css";

interface CodeEditorProps {
  providerRef: React.RefObject<HocuspocusProvider | null>;
  workspaceId: string;
  username: string;
  activeFileId: string;
  language: string;

  cursorPositions: Record<string, any>;
}

function CodeEditor({
  providerRef,
  workspaceId,
  username,
  activeFileId,
  language,
  cursorPositions,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const activeFileIdRef = useRef(activeFileId);
  const languageRef = useRef(language);
  const unbindYTextRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const decorationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    return () => {
      unbindYTextRef.current?.();
    };
  }, []);

  function seedIfEmpty(ytext: ReturnType<typeof getYText>) {
    if (ytext.length === 0) {
      const snippet = CODE_SNIPPETS[languageRef.current];
      if (snippet) ytext.insert(0, snippet);
    }
  }

  function onMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.focus();

    const ytext = getYText(activeFileIdRef.current);
    unbindYTextRef.current = bindMonacoToYText(editor, monaco, ytext, () => {
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

    // Only seed the starter snippet once the shared doc has loaded, so we
    // don't drop a duplicate copy on top of already-synced content.
    const provider = providerRef.current;
    if (provider?.synced) {
      seedIfEmpty(ytext);
    } else {
      provider?.on("synced", () => seedIfEmpty(ytext));
    }

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
    <div className="editor-shell">
      <div className="editor-pane">
        <Editor
          key={activeFileId}
          language={language}
          defaultValue=""
          theme="vs-dark"
          onMount={onMount}
        />
      </div>

      <div className="output-pane">
        <Output editorRef={editorRef} language={language} />
      </div>
    </div>
  );
}

export default CodeEditor;
