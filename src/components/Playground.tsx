import { Check, Clipboard, Play, Sparkles } from "lucide-react";
import * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "@/components/Editor";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useClipboard } from "@/hooks/useClipboard";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import { useMountEffect } from "@/hooks/useMountEffect";
import { generateElasticsearchQuerySchema } from "@/lib/elasticsearch";
import type { ElasticsearchGetIndicesResponse } from "@/types/elasticsearch";

const ELASTICSEARCH_HOST = import.meta.env.VITE_ELASTICSEARCH_HOST;
const ELASTICSEARCH_USERNAME = import.meta.env.VITE_ELASTICSEARCH_USERNAME;
const ELASTICSEARCH_PASSWORD = import.meta.env.VITE_ELASTICSEARCH_PASSWORD;
const DEFAULT_QUERY = `{
  "query": {
    "match_all": {}
  }
}`;

export interface PlaygroundProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Playground = ({ ...props }: PlaygroundProps) => {
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [response, setResponse] = React.useState("");
  const [indices, setIndices] = React.useState<ElasticsearchGetIndicesResponse>();
  const [selectedIndexName, setSelectedIndexName] = React.useState<string>();
  const clipboardForQuery = useClipboard();

  const elasticsearch = useElasticsearch({
    id: "local-elasticsearch",
    name: "Local Elasticsearch",
    auth: {
      type: "basic",
      host: ELASTICSEARCH_HOST,
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
    <div {...props}>
      <div className="flex flex-col gap-1 h-full w-full">
        <div className="h-fit w-full shrink-0 flex gap-1">
          <Select defaultValue="search">
            <SelectTrigger className="w-[120px] shrink-0 border-none bg-white/40 rounded-l-lg rounded-r-none">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Operation</SelectLabel>
                <SelectItem value="search">SEARCH</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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
            className="bg-white/40  rounded-l-none rounded-r-lg w-full overflow-hidden"
          />
        </div>
        <PanelGroup direction="horizontal" className="w-full h-full flex-1 min-h-0">
          <Panel className="w-full h-full bg-white/40 p-3 rounded-lg shadow-lg">
            <PanelGroup direction="vertical" className="w-full h-full">
              <Panel className="w-full h-full flex gap-3 flex-1">
                <div className="flex-1 min-w-0">
                  <Editor
                    language="json"
                    schemas={querySchemas}
                    actions={queryActions}
                    value={query}
                    onChange={(value) => setQuery(value ?? "")}
                  />
                </div>
                <div className="w-fit h-full shrink-0 flex flex-col gap-2 items-center text-gray-700">
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
                  <Button variant="ghost" size="icon" onClick={() => clipboardForQuery.copyToClipboard(query)}>
                    {clipboardForQuery.isCopied ? <Check /> : <Clipboard />}
                  </Button>
                </div>
              </Panel>
              <PanelResizeHandle />
              <Panel className="w-full h-full">
                <div className="text-sm text-gray-500 p-1">
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
};
