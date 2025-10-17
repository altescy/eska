import { type Monaco, default as MonacoEditor } from "@monaco-editor/react";
import type * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import React from "react";

const DEFAULT_OPTIONS: MonacoAPI.editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  wordWrap: "on",
  wrappingIndent: "indent",
  scrollBeyondLastLine: false,
  fontFamily: "'Fira Code Variable', monospace",
  tabSize: 2,
  formatOnPaste: true,
  formatOnType: true,
  automaticLayout: true,
  stickyScroll: { enabled: false },
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
};

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

  return (
    <MonacoEditor
      theme="eska"
      width="100%"
      height="100%"
      value={value}
      defaultLanguage={language}
      beforeMount={handleEditorWillMount}
      onMount={handlEditorDidMount}
      options={{ ...DEFAULT_OPTIONS, readOnly, lineNumbers }}
      onChange={onChange}
    />
  );
};
