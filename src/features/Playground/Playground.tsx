import { useAtomValue } from "jotai";
import JSON5 from "json5";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";
import { editorSettingsAtom } from "@/atoms/editor";
import { useClipboard } from "@/hooks/useClipboard";
import { useClusters } from "@/hooks/useClusters";
import { useCollections } from "@/hooks/useCollections";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import { extractFields, generateElasticsearchQuerySchema } from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type { Collection } from "@/types/collection";
import type { ElasticsearchGetIndicesResponse } from "@/types/elasticsearch";
import type { PlaygroundState } from "@/types/playground";

import { PlaygroundToolbar } from "./PlaygroundToolbar";
import { QueryEditor } from "./QueryEditor";
import { ResponseViewer } from "./ResponseViewer";

const DEFAULT_QUERY = `{
  // Default query to match all documents
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
    const editorSettings = useAtomValue(editorSettingsAtom);

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
        const parsed = JSON5.parse(query);
        parsed._source = [...((parsed._source as string[]) ?? []), ...selectedFields];
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
          const queryObject = JSON5.parse(composedQuery);
          const response = await elasticsearch.search(cluster, selectedIndexName, queryObject);
          setResponse(JSON.stringify(response, null, 2));
        } catch (error) {
          toast("Failed to execute search query.", {
            description: error instanceof Error ? error.message : String(error),
          });
          console.error("Error executing search query:", error);
        }
      })();
    }, [composedQuery, selectedIndexName, elasticsearch.search]);

    const handleCopyQueryToClipboard = React.useCallback(() => {
      const textToCopy =
        editorSettings.clipboardFormat === "json" ? JSON.stringify(JSON5.parse(query), null, 2) : query;
      clipboardForQuery.copyToClipboard(textToCopy);
    }, [clipboardForQuery, editorSettings.clipboardFormat, query]);

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

    const fields = React.useMemo(
      () => (selectedIndex ? extractFields(selectedIndex.mappings) : undefined),
      [selectedIndex],
    );

    return (
      <div {...props}>
        <div className="flex flex-col gap-1 h-full w-full">
          <PlaygroundToolbar
            clusters={clusters}
            selectedCluster={cluster}
            indices={indices}
            selectedIndexName={selectedIndexName}
            collection={collection}
            saveDialogOpen={saveDialogOpen}
            isSaved={collections.isSaved}
            isLoadingIndices={elasticsearch.isLoading}
            onClusterChange={setCluster}
            onIndexChange={setSelectedIndexName}
            onSaveDialogOpenChange={setSaveDialogOpen}
          />
          <PanelGroup direction="horizontal" className="w-full h-full flex-1 min-h-0">
            <QueryEditor
              query={query}
              querySchemas={querySchemas}
              fields={fields}
              isLoading={elasticsearch.isLoading}
              isRunDisabled={!selectedIndex}
              isCopied={clipboardForQuery.isCopied}
              onQueryChange={setQuery}
              onFieldsSelectionChange={setSelectedFields}
              onRun={handleSearch}
              onCopy={handleCopyQueryToClipboard}
            />
            <PanelResizeHandle />
            <Panel>
              <ResponseViewer response={response} />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    );
  },
);
