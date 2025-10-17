import { Check, Clipboard, Folder, History, Play, Server, Settings, Sparkles } from "lucide-react";
import * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import "@fontsource-variable/fira-code";
import { Editor } from "@/components/Editor";
import { useClipboard } from "@/hooks/useClipboard";
import { type ElasticsearchGetIndicesResponse, useElasticsearch } from "@/hooks/useElasticsearch";
import { useMountEffect } from "@/hooks/useMountEffect";
import { generateElasticsearchQuerySchema } from "@/lib/elasticsearch";

const ELASTICSEARCH_HOST = import.meta.env.VITE_ELASTICSEARCH_HOST;
const ELASTICSEARCH_USERNAME = import.meta.env.VITE_ELASTICSEARCH_USERNAME;
const ELASTICSEARCH_PASSWORD = import.meta.env.VITE_ELASTICSEARCH_PASSWORD;
const DEFAULT_QUERY = `{
  "query": {
    "match_all": {}
  }
}`;

function App() {
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [response, setResponse] = React.useState("");
  const [indices, setIndices] = React.useState<ElasticsearchGetIndicesResponse>();
  const [selectedIndexName, setSelectedIndexName] = React.useState<string>();
  const clipboardForQuery = useClipboard();

  const elasticsearch = useElasticsearch({
    host: ELASTICSEARCH_HOST,
    auth: {
      type: "basic",
      username: ELASTICSEARCH_USERNAME,
      password: ELASTICSEARCH_PASSWORD,
    },
  });

  useMountEffect(async () => {
    setIndices(await elasticsearch.getIndices());
  });

  const handleSearch = React.useCallback(() => {
    if (!selectedIndexName) {
      return;
    }
    (async () => {
      const response = await elasticsearch.search(selectedIndexName, JSON.parse(query));
      setResponse(JSON.stringify(response, null, 2));
    })();
  }, [query, selectedIndexName, elasticsearch]);

  const handleFormatQuery = React.useCallback(() => {
    try {
      const parsed = JSON.parse(query);
      const formatted = JSON.stringify(parsed, null, 2);
      setQuery(formatted);
    } catch {
      // Ignore JSON parse errors
    }
  }, [query]);

  const selectedIndex = React.useMemo(() => {
    if (selectedIndexName && indices) {
      return indices[selectedIndexName];
    }
  }, [selectedIndexName, indices]);

  const querySchemas = React.useMemo(() => {
    if (selectedIndex) {
      return [
        {
          uri: "http://elasticsearch/query-schema.json",
          fileMatch: ["*"],
          schema: generateElasticsearchQuerySchema(selectedIndex.mappings),
        },
      ];
    }
    return [];
  }, [selectedIndex]);

  const queryActions = React.useMemo(
    () => [
      {
        id: "run-query",
        label: "Run Query",
        keybindings: [MonacoAPI.KeyMod.CtrlCmd | MonacoAPI.KeyCode.Enter],
        run: () => {
          handleSearch();
        },
      },
    ],
    [handleSearch],
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="w-full h-10 pl-20 shrink-0 flex items-center app-region-drag" />
      <div className="w-full flex flex-1 px-3 pt-1 pb-3 overflow-hidden">
        <div className="w-fit h-full flex flex-col pr-2 gap-1">
          <Button variant="ghost" size="icon-lg" className="shrink-0">
            <Server />
          </Button>
          <Button variant="ghost" size="icon-lg" className="shrink-0">
            <Folder />
          </Button>
          <Button variant="ghost" size="icon-lg" className="shrink-0">
            <History />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon-lg" className="shrink-0">
            <Settings />
          </Button>
        </div>
        <PanelGroup direction="horizontal" className="flex w-full h-full bg-white rounded-xl p-3 gap-2">
          <Panel className="w-full h-full flex flex-col bg-gray-50 p-3 rounded-lg shadow-lg">
            <PanelGroup direction="vertical" className="w-full h-full">
              <Panel className="w-full h-full flex gap-3">
                <div className="flex-1 min-w-0">
                  <Editor
                    language="json"
                    schemas={querySchemas}
                    actions={queryActions}
                    value={query}
                    onChange={(value) => setQuery(value ?? "")}
                  />
                </div>
                <div className="w-fit h-full shrink-0 flex flex-col gap-1 items-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleSearch}
                    disabled={!selectedIndex || elasticsearch.isLoading}
                  >
                    {elasticsearch.isLoading ? <Spinner /> : <Play />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleFormatQuery}>
                    <Sparkles />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-2"
                    onClick={() => clipboardForQuery.copyToClipboard(query)}
                  >
                    {clipboardForQuery.isCopied ? <Check /> : <Clipboard />}
                  </Button>
                </div>
              </Panel>
              <PanelResizeHandle />
              <Panel className="w-full h-20 shrink-0">
                <div className="text-sm text-gray-500 p-1">
                  <Combobox
                    items={Object.entries(indices ?? {}).map(([name, index]) => ({
                      key: name,
                      value: name,
                      label: name,
                      details: (
                        <div>
                          {Object.keys(index.aliases).map((alias) => (
                            <div key={alias} className="text-xs text-gray-400">
                              {alias}
                            </div>
                          ))}
                        </div>
                      ),
                    }))}
                    placeholder={elasticsearch.isLoading ? "Loading indices..." : "Select index"}
                    onSelectItem={(indexName) => setSelectedIndexName(indexName)}
                  />
                  <pre className="mt-2 overflow-auto">
                    {selectedIndex && <code>{JSON.stringify(selectedIndex, null, 2)}</code>}
                  </pre>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle />
          <Panel>
            <Editor language="json" value={response} readOnly lineNumbers="off" />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
