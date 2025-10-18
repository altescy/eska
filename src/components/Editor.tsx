import { type Monaco, default as MonacoEditor } from "@monaco-editor/react";
import { useAtom } from "jotai";
import type * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import { initVimMode } from "monaco-vim";
import React from "react";
import { editorSettingsAtom } from "@/atoms/editor";

const getEditorOptions = (settings: {
  fontSize: number;
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
}): MonacoAPI.editor.IStandaloneEditorConstructionOptions => ({
  fontSize: settings.fontSize,
  minimap: { enabled: settings.minimap },
  wordWrap: settings.wordWrap,
  tabSize: settings.tabSize,
  wrappingIndent: "indent",
  scrollBeyondLastLine: false,
  fontFamily: "'Fira Code Variable', monospace",
  formatOnPaste: true,
  formatOnType: true,
  automaticLayout: true,
  stickyScroll: { enabled: false },
  lineDecorationsWidth: 0,
  scrollbar: {
    vertical: "auto",
    horizontal: "auto",
    useShadows: false,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    arrowSize: 0,
  },
  guides: {
    indentation: false,
    highlightActiveIndentation: false,
  },
});

export interface EditorProps {
  language: string;
  value?: string;
  readOnly?: boolean;
  schemas?: MonacoAPI.languages.json.DiagnosticsOptions["schemas"];
  actions?: MonacoAPI.editor.IActionDescriptor[];
  onChange?: (value: string | undefined) => void;
  lineNumbers?: "on" | "off" | "relative" | "interval";
}

export const Editor = ({ language, value, readOnly, schemas, actions, onChange, lineNumbers }: EditorProps) => {
  const [editor, setEditor] = React.useState<MonacoAPI.editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = React.useState<Monaco | null>(null);
  const [editorSettings] = useAtom(editorSettingsAtom);

  const handleEditorWillMount = React.useCallback((monacoInstance: Monaco) => {
    setMonaco(monacoInstance);
  }, []);

  const handlEditorDidMount = React.useCallback((editorInstance: MonacoAPI.editor.IStandaloneCodeEditor) => {
    setEditor(editorInstance);
  }, []);

  React.useEffect(() => {
    if (schemas) {
      monaco?.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: schemas,
      });
    }
  }, [monaco, schemas]);

  React.useEffect(() => {
    if (editor && actions) {
      actions.forEach((action) => {
        editor.addAction(action);
      });
    }
  }, [editor, actions]);

  React.useEffect(() => {
    monaco?.editor.defineTheme("eska", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });
    monaco?.editor.setTheme("eska");
  }, [monaco]);

  React.useEffect(() => {
    if (!editor) return;

    let vimMode: { dispose: () => void } | null = null;

    if (editorSettings.keyBinding === "vim") {
      vimMode = initVimMode(editor, document.getElementById("vim-status-bar") || undefined);
    }

    return () => {
      vimMode?.dispose();
    };
  }, [editor, editorSettings.keyBinding]);

  return (
    <MonacoEditor
      theme="eska"
      width="100%"
      height="100%"
      value={value}
      defaultLanguage={language}
      beforeMount={handleEditorWillMount}
      onMount={handlEditorDidMount}
      options={{ ...getEditorOptions(editorSettings), readOnly, lineNumbers }}
      onChange={onChange}
    />
  );
};
