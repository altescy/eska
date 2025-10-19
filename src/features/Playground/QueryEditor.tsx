import * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor, type EditorHandle } from "@/components/Editor";
import type { ElasticsearchField } from "@/types/elasticsearch";

import { Fields } from "./Fields";
import { QueryActions } from "./QueryActions";

export interface QueryEditorProps {
  query: string;
  querySchemas: MonacoAPI.languages.json.DiagnosticsOptions["schemas"];
  fields?: Record<string, ElasticsearchField>;
  isLoading?: boolean;
  isRunDisabled?: boolean;
  isCopied?: boolean;
  onQueryChange: (query: string) => void;
  onFieldsSelectionChange?: (fields: string[]) => void;
  onRun: () => void;
  onCopy: () => void;
}

export const QueryEditor = ({
  query,
  querySchemas,
  fields,
  isLoading = false,
  isRunDisabled = false,
  isCopied = false,
  onQueryChange,
  onFieldsSelectionChange,
  onRun,
  onCopy,
}: QueryEditorProps) => {
  const queryEditorRef = React.useRef<EditorHandle>(null);

  const queryActions = React.useMemo(
    () => [
      {
        id: "run-query",
        label: "Run Query",
        keybindings: [MonacoAPI.KeyMod.CtrlCmd | MonacoAPI.KeyCode.Enter],
        run: () => {
          onRun();
        },
      },
    ],
    [onRun],
  );

  const handleFormat = React.useCallback(() => {
    queryEditorRef.current?.format();
  }, []);

  return (
    <Panel className="w-full h-full bg-white/40 p-3 rounded-lg shadow-lg">
      <PanelGroup direction="vertical" className="w-full h-full">
        <Panel className="w-full h-full flex gap-3 flex-1">
          <div className="flex-1 min-w-0">
            <Editor
              ref={queryEditorRef}
              language="json"
              schemas={querySchemas}
              actions={queryActions}
              value={query}
              onChange={(value) => onQueryChange(value ?? "")}
            />
          </div>
          <QueryActions
            onRun={onRun}
            onFormat={handleFormat}
            onCopy={onCopy}
            isLoading={isLoading}
            isRunDisabled={isRunDisabled}
            isCopied={isCopied}
          />
        </Panel>
        {fields && (
          <>
            <PanelResizeHandle />
            <Panel className="w-full h-full">
              <Fields
                fields={fields}
                className="w-full h-full overflow-hidden"
                onSelectionChange={onFieldsSelectionChange}
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </Panel>
  );
};
