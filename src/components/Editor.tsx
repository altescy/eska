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
  model?: MonacoAPI.editor.ITextModel;
  onMonacoMount?: (monaco: Monaco) => void;
}

export interface EditorHandle {
  format: () => void;
}

export const Editor = React.forwardRef<EditorHandle, EditorProps>(
  ({ language, value, readOnly, schemas, actions, onChange, lineNumbers, model, onMonacoMount }, ref) => {
    const [editor, setEditor] = React.useState<MonacoAPI.editor.IStandaloneCodeEditor | null>(null);
    const [monaco, setMonaco] = React.useState<Monaco | null>(null);
    const [editorSettings] = useAtom(editorSettingsAtom);

    const handleEditorWillMount = React.useCallback(
      (monacoInstance: Monaco) => {
        setMonaco(monacoInstance);
        onMonacoMount?.(monacoInstance);
      },
      [onMonacoMount],
    );

    const handlEditorDidMount = React.useCallback((editorInstance: MonacoAPI.editor.IStandaloneCodeEditor) => {
      setEditor(editorInstance);
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        format: () => {
          editor?.getAction("editor.action.formatDocument")?.run();
        },
      }),
      [editor],
    );

    // Set model if provided
    React.useEffect(() => {
      if (editor && model) {
        const currentModel = editor.getModel();
        if (currentModel !== model) {
          editor.setModel(model);
        }
      }
    }, [editor, model]);

    // Only configure schemas if not using model-based approach
    React.useEffect(() => {
      if (schemas && !model) {
        monaco?.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: true,
          trailingCommas: "ignore",
          schemas: schemas,
        });
      }
    }, [monaco, schemas, model]);

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
        value={model ? undefined : value}
        defaultLanguage={language}
        beforeMount={handleEditorWillMount}
        onMount={handlEditorDidMount}
        options={{ ...getEditorOptions(editorSettings), readOnly, lineNumbers }}
        onChange={onChange}
      />
    );
  },
);
