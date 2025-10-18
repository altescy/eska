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
import { useClusters } from "@/hooks/useClusters";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import { generateElasticsearchQuerySchema } from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type { ElasticsearchGetIndicesResponse } from "@/types/elasticsearch";
import type { PlaygroundState } from "@/types/playground";

const DEFAULT_QUERY = `{
  "query": {
    "match_all": {}
  }
}`;

export interface PlaygroundProps extends React.HTMLAttributes<HTMLDivElement> {
  initialState?: PlaygroundState;
  onStateChange?: (state: PlaygroundState) => void;
}

export interface PlaygroundHandler {
  getState: () => PlaygroundState;
}

export const Playground = React.forwardRef<PlaygroundHandler, PlaygroundProps>(
  ({ initialState, onStateChange, ...props }, ref) => {
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [query, setQuery] = React.useState(DEFAULT_QUERY);
    const [response, setResponse] = React.useState("");
    const [clusters] = useClusters();
    const [cluster, setCluster] = React.useState<Cluster>();
    const [indices, setIndices] = React.useState<ElasticsearchGetIndicesResponse>();
    const [selectedIndexName, setSelectedIndexName] = React.useState<string>();
    const clipboardForQuery = useClipboard();

    const elasticsearch = useElasticsearch();

    React.useImperativeHandle(
      ref,
      () => ({
        getState: () => ({
          clusterId: cluster?.id,
          indexName: selectedIndexName,
          query,
          response,
        }),
      }),
      [cluster, selectedIndexName, query, response],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: onStateChange is intentionally excluded to prevent infinite loops
    React.useEffect(() => {
      // Only trigger onStateChange after initialization is complete
      if (!isInitialized) return;

      onStateChange?.({
        clusterId: cluster?.id,
        indexName: selectedIndexName,
        query,
        response,
      });
    }, [isInitialized, cluster, selectedIndexName, query, response]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: initialState properties are intentionally excluded as this should only run once on mount when clusters load
    React.useEffect(() => {
      if (isInitialized || clusters.length < 1) return;
      if (initialState?.clusterId) {
        const initialCluster = clusters.find((c) => c.id === initialState.clusterId);
        // TODO: handle case when initialCluster is not found
        setCluster(initialCluster);
      }
      if (initialState?.indexName) {
        setSelectedIndexName(initialState.indexName);
      }
      if (initialState?.query) {
        setQuery(initialState.query);
      }
      if (initialState?.response) {
        setResponse(initialState.response);
      }
      setIsInitialized(true);
    }, [isInitialized, clusters]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
    React.useEffect(() => {
      (async () => {
        if (cluster) {
          setIndices(await elasticsearch.getIndices(cluster));
        } else {
          setIndices(undefined);
          setSelectedIndexName(undefined);
        }
      })();
    }, [cluster]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
    const handleSearch = React.useCallback(() => {
      if (!cluster || !selectedIndexName) return;
      (async () => {
        const response = await elasticsearch.search(cluster, selectedIndexName, JSON.parse(query));
        setResponse(JSON.stringify(response, null, 2));
      })();
    }, [query, selectedIndexName, elasticsearch.search]);

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
            <Combobox
              initialKey={cluster?.id}
              items={clusters.map((c) => ({
                key: c.id,
                value: c.id,
                label: c.name,
                details: <div className="text-xs text-gray-400">{c.auth.host}</div>,
              }))}
              placeholder="Select cluster"
              onSelectItem={(selected) => setCluster(clusters.find((c) => c.id === selected?.key))}
              className="w-[200px] shrink-0 bg-white/40 rounded-lg overflow-hidden"
            />
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
              initialKey={selectedIndexName}
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
              onSelectItem={(selected) => setSelectedIndexName(selected?.key)}
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
                {selectedIndex && (
                  <>
                    <PanelResizeHandle />
                    <Panel className="w-full h-full">
                      <div className="text-sm text-gray-500 p-1">
                        <pre className="mt-2 overflow-auto">
                          {selectedIndex && <code>{JSON.stringify(selectedIndex, null, 2)}</code>}
                        </pre>
                      </div>
                    </Panel>
                  </>
                )}
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
  },
);
