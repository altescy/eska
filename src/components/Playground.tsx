import { Check, Clipboard, CornerDownRight, Play, Save, Sparkles } from "lucide-react";
import * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";
import { SaveCollectionDialog } from "@/components/Collections";
import { Editor } from "@/components/Editor";
import { Fields } from "@/components/Fields";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClipboard } from "@/hooks/useClipboard";
import { useClusters } from "@/hooks/useClusters";
import { useCollections } from "@/hooks/useCollections";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import { extractFields, generateElasticsearchQuerySchema } from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type { Collection } from "@/types/collection";
import type { ElasticsearchGetIndicesResponse } from "@/types/elasticsearch";
import type { PlaygroundState } from "@/types/playground";

const DEFAULT_QUERY = `{
  "query": {
    "match_all": {}
  }
}`;

export interface PlaygroundProps extends React.HTMLAttributes<HTMLDivElement> {
  collectionId: string;
  initialState?: PlaygroundState;
  onStateChange?: (state: PlaygroundState) => void;
}

export interface PlaygroundHandler {
  getState: () => PlaygroundState;
}

export const Playground = React.forwardRef<PlaygroundHandler, PlaygroundProps>(
  ({ collectionId, initialState, onStateChange, hidden, ...props }, ref) => {
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [query, setQuery] = React.useState(DEFAULT_QUERY);
    const [response, setResponse] = React.useState("");
    const [clusters] = useClusters();
    const [cluster, setCluster] = React.useState<Cluster>();
    const [indices, setIndices] = React.useState<ElasticsearchGetIndicesResponse>();
    const [selectedIndexName, setSelectedIndexName] = React.useState<string>();
    const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
    const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
    const clipboardForQuery = useClipboard();

    const elasticsearch = useElasticsearch();
    const collections = useCollections();

    React.useImperativeHandle(
      ref,
      () => ({
        getState: () => ({
          collectionId,
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          operation: {
            type: "search",
            indexName: selectedIndexName,
            query,
            response,
          },
        }),
      }),
      [cluster, selectedIndexName, query, response, collectionId],
    );

    const composedQuery = React.useMemo(() => {
      if (selectedFields.length === 0) {
        return query;
      }
      try {
        const parsed = JSON.parse(query);
        parsed._source = [...(parsed._source ?? []), ...selectedFields];
        return JSON.stringify(parsed, null, 2);
      } catch {
        return query;
      }
    }, [query, selectedFields]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: collections.byId is stable
    const collection = React.useMemo((): Collection => {
      let existing = collectionId ? collections.byId(collectionId) : undefined;
      if (existing?.type !== "elasticsearch") existing = undefined;
      return {
        id: collectionId,
        type: "elasticsearch",
        name: existing?.name ?? `${cluster?.name ?? "No cluster"} / ${selectedIndexName ?? "No index"}`,
        content: {
          type: "search",
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          indexName: selectedIndexName,
          query,
          response,
        },
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
    }, [cluster, selectedIndexName, query, response, collectionId, collections.byId]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: onStateChange is intentionally excluded to prevent infinite loops
    React.useEffect(() => {
      // Only trigger onStateChange after initialization is complete
      if (!isInitialized) return;
      onStateChange?.({
        clusterId: cluster?.id,
        clusterName: cluster?.name,
        operation: {
          type: "search",
          indexName: selectedIndexName,
          query,
          response,
        },
        collectionId,
      });
    }, [isInitialized, cluster, selectedIndexName, query, response, collectionId]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: initialState properties are intentionally excluded as this should only run once on mount when clusters load
    React.useEffect(() => {
      if (isInitialized || clusters.length < 1) return;
      if (initialState?.clusterId) {
        const initialCluster = clusters.find((c) => c.id === initialState.clusterId);
        // TODO: handle case when initialCluster is not found
        setCluster(initialCluster);
      }
      if (initialState?.operation?.indexName) {
        setSelectedIndexName(initialState.operation.indexName);
      }
      if (initialState?.operation?.query) {
        setQuery(initialState.operation.query);
      }
      if (initialState?.operation?.response) {
        setResponse(initialState.operation.response);
      }
      setIsInitialized(true);
    }, [isInitialized, clusters]);

    React.useEffect(() => {
      // Only attach keyboard listener if this Playground is visible
      if (hidden) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        // Ctrl/Cmd + S to open save collection dialog
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          setSaveDialogOpen(true);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [hidden]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
    React.useEffect(() => {
      (async () => {
        try {
          if (cluster) {
            setIndices(await elasticsearch.getIndices(cluster));
          } else {
            setIndices(undefined);
            setSelectedIndexName(undefined);
          }
        } catch (error) {
          toast("Failed to fetch indices from the selected cluster.", {
            description: error instanceof Error ? error.message : String(error),
          });
          console.error("Error fetching indices:", error);
        }
      })();
    }, [cluster]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
    const handleSearch = React.useCallback(() => {
      if (!cluster || !selectedIndexName) return;
      (async () => {
        try {
          const response = await elasticsearch.search(cluster, selectedIndexName, JSON.parse(composedQuery));
          setResponse(JSON.stringify(response, null, 2));
        } catch (error) {
          toast("Failed to execute search query.", {
            description: error instanceof Error ? error.message : String(error),
          });
          console.error("Error executing search query:", error);
        }
      })();
    }, [composedQuery, selectedIndexName, elasticsearch.search]);

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
        // First, try to find the index directly
        if (indices[selectedIndexName]) {
          return indices[selectedIndexName];
        }

        // If not found, search for an index that has this name as an alias
        for (const [_indexName, index] of Object.entries(indices)) {
          if (Object.keys(index.aliases).includes(selectedIndexName)) {
            return index;
          }
        }
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

    const fields = React.useMemo(
      () => (selectedIndex ? extractFields(selectedIndex.mappings) : undefined),
      [selectedIndex],
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
              className="w-[200px] shrink-0 bg-white/40 rounded-l-lg overflow-hidden"
            />
            <Select defaultValue="search">
              <SelectTrigger className="w-[120px] shrink-0 border-none bg-white/40 rounded-none rounded-r-none">
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
              items={[
                // Create items for indices
                ...Object.entries(indices ?? {}).map(([name, index]) => ({
                  key: name,
                  value: name,
                  label: name,
                  details: (
                    <div className="text-xs text-gray-500">
                      {Object.keys(index.aliases).length > 0
                        ? Object.keys(index.aliases).map((alias) => (
                            <div key={alias} className="ml-2">
                              {alias}
                            </div>
                          ))
                        : "Index"}
                    </div>
                  ),
                })),
                // Create items for aliases
                ...Object.entries(indices ?? {}).flatMap(([indexName, index]) =>
                  Object.keys(index.aliases).map((alias) => ({
                    key: alias,
                    value: alias,
                    label: alias,
                    details: (
                      <div className="text-xs text-gray-500">
                        <CornerDownRight className="text-gray-400 inline-block -translate-y-0.5" /> {indexName}
                      </div>
                    ),
                  })),
                ),
              ]}
              placeholder={elasticsearch.isLoading ? "Loading indices..." : "Select index or alias"}
              onSelectItem={(selected) => setSelectedIndexName(selected?.key)}
              className="bg-white/40  rounded-l-none rounded-r-lg w-full overflow-hidden"
            />
            <SaveCollectionDialog collection={collection} open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <Button variant="ghost" size="icon" disabled={collections.isSaved} className="text-gray-600">
                {collections.isSaved ? <Check /> : <Save />}
              </Button>
            </SaveCollectionDialog>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={handleSearch}
                          disabled={!selectedIndex || elasticsearch.isLoading}
                        >
                          {elasticsearch.isLoading ? <Spinner /> : <Play />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Run query</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleFormatQuery}>
                          <Sparkles />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Format query</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => clipboardForQuery.copyToClipboard(query)}>
                          {clipboardForQuery.isCopied ? <Check /> : <Clipboard />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{clipboardForQuery.isCopied ? "Copied" : "Copy query"}</TooltipContent>
                    </Tooltip>
                  </div>
                </Panel>
                {fields && (
                  <>
                    <PanelResizeHandle />
                    <Panel className="w-full h-full">
                      <Fields
                        fields={fields}
                        className="w-full h-full overflow-hidden"
                        onSelectionChange={setSelectedFields}
                      />
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
