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
import {
  extractAnalyzableFields,
  extractAnalyzers,
  extractFields,
  generateElasticsearchQuerySchema,
} from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type { Collection } from "@/types/collection";
import type {
  ElasticsearchAnalyzeOperationState,
  ElasticsearchGetIndicesResponse,
  ElasticsearchGetOperationState,
  ElasticsearchInfoOperationState,
  ElasticsearchOperation,
  ElasticsearchOperationState,
} from "@/types/elasticsearch";
import type { PlaygroundState } from "@/types/playground";

import { AnalyzeForm } from "./forms/AnalyzeForm";
import { GetForm } from "./forms/GetForm";
import { InfoForm } from "./forms/InfoForm";
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
  tabId: string;
  initialState?: PlaygroundState;
  onStateChange?: (state: PlaygroundState) => void;
}

export interface PlaygroundHandler {
  getState: () => PlaygroundState;
}

export const Playground = React.forwardRef<PlaygroundHandler, PlaygroundProps>(
  ({ collectionId, tabId, initialState, onStateChange, hidden, ...props }, ref) => {
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [operationType, setOperationType] = React.useState<ElasticsearchOperation>("search");
    const [operationState, setOperationState] = React.useState<Partial<ElasticsearchOperationState>>({});
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
        getState: () => {
          let operation: ElasticsearchOperationState;
          if (operationType === "search") {
            operation = {
              type: "search",
              indexName: selectedIndexName,
              query,
              response,
            };
          } else if (operationType === "get") {
            const getState = operationState as ElasticsearchGetOperationState;
            operation = {
              type: "get",
              clusterId: cluster?.id,
              clusterName: cluster?.name,
              indexName: selectedIndexName,
              documentId: getState.documentId,
              routing: getState.routing,
              preference: getState.preference,
              realtime: getState.realtime,
              refresh: getState.refresh,
              version: getState.version,
              versionType: getState.versionType,
              storedFields: getState.storedFields,
              sourceIncludes: getState.sourceIncludes,
              sourceExcludes: getState.sourceExcludes,
              response,
            };
          } else if (operationType === "analyze") {
            const analyzeState = operationState as ElasticsearchAnalyzeOperationState;
            operation = {
              type: "analyze",
              clusterId: cluster?.id,
              clusterName: cluster?.name,
              indexName: selectedIndexName,
              text: analyzeState.text,
              analyzer: analyzeState.analyzer,
              field: analyzeState.field,
              tokenizer: analyzeState.tokenizer,
              filter: analyzeState.filter,
              charFilter: analyzeState.charFilter,
              explain: analyzeState.explain,
              attributes: analyzeState.attributes,
              response,
            };
          } else if (operationType === "info") {
            const infoState = operationState as ElasticsearchInfoOperationState;
            operation = {
              type: "info",
              clusterId: cluster?.id,
              clusterName: cluster?.name,
              indexName: selectedIndexName,
              infoType: infoState.infoType,
              response,
            };
          } else {
            operation = {
              type: "search",
              indexName: selectedIndexName,
              query,
              response,
            };
          }
          return {
            collectionId,
            clusterId: cluster?.id,
            clusterName: cluster?.name,
            operation,
          };
        },
      }),
      [cluster, selectedIndexName, query, response, collectionId, operationType, operationState],
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

      let content: ElasticsearchOperationState;
      if (operationType === "search") {
        content = {
          type: "search",
          indexName: selectedIndexName,
          query,
          response,
        };
      } else if (operationType === "get") {
        const getState = operationState as ElasticsearchGetOperationState;
        content = {
          type: "get",
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          indexName: selectedIndexName,
          documentId: getState.documentId,
          routing: getState.routing,
          preference: getState.preference,
          realtime: getState.realtime,
          refresh: getState.refresh,
          version: getState.version,
          versionType: getState.versionType,
          storedFields: getState.storedFields,
          sourceIncludes: getState.sourceIncludes,
          sourceExcludes: getState.sourceExcludes,
          response,
        };
      } else if (operationType === "analyze") {
        const analyzeState = operationState as ElasticsearchAnalyzeOperationState;
        content = {
          type: "analyze",
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          indexName: selectedIndexName,
          text: analyzeState.text,
          analyzer: analyzeState.analyzer,
          field: analyzeState.field,
          tokenizer: analyzeState.tokenizer,
          filter: analyzeState.filter,
          charFilter: analyzeState.charFilter,
          explain: analyzeState.explain,
          attributes: analyzeState.attributes,
          response,
        };
      } else if (operationType === "info") {
        const infoState = operationState as ElasticsearchInfoOperationState;
        content = {
          type: "info",
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          indexName: selectedIndexName,
          infoType: infoState.infoType,
          response,
        };
      } else {
        content = {
          type: "search",
          indexName: selectedIndexName,
          query,
          response,
        };
      }

      return {
        id: collectionId,
        type: "elasticsearch",
        name: existing?.name ?? `${cluster?.name ?? "No cluster"} / ${selectedIndexName ?? "No index"}`,
        content,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
    }, [cluster, selectedIndexName, query, response, collectionId, collections.byId, operationType, operationState]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: onStateChange is intentionally excluded to prevent infinite loops
    React.useEffect(() => {
      // Only trigger onStateChange after initialization is complete
      if (!isInitialized) return;

      let operation: ElasticsearchOperationState;
      if (operationType === "search") {
        operation = {
          type: "search",
          indexName: selectedIndexName,
          query,
          response,
        };
      } else if (operationType === "get") {
        const getState = operationState as ElasticsearchGetOperationState;
        operation = {
          type: "get",
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          indexName: selectedIndexName,
          documentId: getState.documentId,
          routing: getState.routing,
          preference: getState.preference,
          realtime: getState.realtime,
          refresh: getState.refresh,
          version: getState.version,
          versionType: getState.versionType,
          storedFields: getState.storedFields,
          sourceIncludes: getState.sourceIncludes,
          sourceExcludes: getState.sourceExcludes,
          response,
        };
      } else if (operationType === "analyze") {
        const analyzeState = operationState as ElasticsearchAnalyzeOperationState;
        operation = {
          type: "analyze",
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          indexName: selectedIndexName,
          text: analyzeState.text,
          analyzer: analyzeState.analyzer,
          field: analyzeState.field,
          tokenizer: analyzeState.tokenizer,
          filter: analyzeState.filter,
          charFilter: analyzeState.charFilter,
          explain: analyzeState.explain,
          attributes: analyzeState.attributes,
          response,
        };
      } else if (operationType === "info") {
        const infoState = operationState as ElasticsearchInfoOperationState;
        operation = {
          type: "info",
          clusterId: cluster?.id,
          clusterName: cluster?.name,
          indexName: selectedIndexName,
          infoType: infoState.infoType,
          response,
        };
      } else {
        operation = {
          type: "search",
          indexName: selectedIndexName,
          query,
          response,
        };
      }

      onStateChange?.({
        clusterId: cluster?.id,
        clusterName: cluster?.name,
        operation,
        collectionId,
      });
    }, [isInitialized, cluster, selectedIndexName, query, response, collectionId, operationType, operationState]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: initialState properties are intentionally excluded as this should only run once on mount when clusters load
    React.useEffect(() => {
      if (isInitialized || clusters.length < 1) return;
      if (initialState?.clusterId) {
        const initialCluster = clusters.find((c) => c.id === initialState.clusterId);
        // TODO: handle case when initialCluster is not found
        setCluster(initialCluster);
      }
      if (initialState?.operation) {
        const operation = initialState.operation;
        setOperationType(operation.type);
        if (operation.indexName) {
          setSelectedIndexName(operation.indexName);
        }
        if (operation.type === "search") {
          if (operation.query) {
            setQuery(operation.query);
          }
        } else if (operation.type === "get") {
          setOperationState(operation);
        } else if (operation.type === "analyze") {
          setOperationState(operation);
        } else if (operation.type === "info") {
          setOperationState(operation);
        }
        if (operation.response) {
          setResponse(operation.response);
        }
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

    // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
    const handleGet = React.useCallback(() => {
      if (!cluster || !selectedIndexName) return;
      (async () => {
        try {
          const getState = operationState as ElasticsearchGetOperationState;
          if (!getState.documentId) {
            toast("Document ID is required.", {
              description: "Please enter a document ID to retrieve.",
            });
            return;
          }

          const sourceIncludes = [...(getState.sourceIncludes ?? []), ...selectedFields];

          const response = await elasticsearch.getDocument(cluster, selectedIndexName, getState.documentId, {
            routing: getState.routing,
            realtime: getState.realtime,
            refresh: getState.refresh,
            preference: getState.preference,
            version: getState.version,
            versionType: getState.versionType,
            storedFields: getState.storedFields,
            _source: sourceIncludes.length > 0 ? sourceIncludes : undefined,
            _sourceExcludes: getState.sourceExcludes,
          });
          setResponse(JSON.stringify(response, null, 2));
        } catch (error) {
          toast("Failed to get document.", {
            description: error instanceof Error ? error.message : String(error),
          });
          console.error("Error getting document:", error);
        }
      })();
    }, [cluster, selectedIndexName, operationState, selectedFields, elasticsearch.getDocument]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
    const handleAnalyze = React.useCallback(() => {
      if (!cluster) return;
      (async () => {
        try {
          const analyzeState = operationState as ElasticsearchAnalyzeOperationState;
          if (!analyzeState.text) {
            toast("Text is required.", {
              description: "Please enter text to analyze.",
            });
            return;
          }

          const response = await elasticsearch.analyzeText(cluster, selectedIndexName, {
            text: analyzeState.text,
            analyzer: analyzeState.analyzer,
            field: analyzeState.field,
            tokenizer: analyzeState.tokenizer,
            filter: analyzeState.filter,
            charFilter: analyzeState.charFilter,
            explain: analyzeState.explain,
            attributes: analyzeState.attributes,
          });
          setResponse(JSON.stringify(response, null, 2));
        } catch (error) {
          toast("Failed to analyze text.", {
            description: error instanceof Error ? error.message : String(error),
          });
          console.error("Error analyzing text:", error);
        }
      })();
    }, [cluster, selectedIndexName, operationState, elasticsearch.analyzeText]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
    const handleInfo = React.useCallback(() => {
      if (!cluster || !selectedIndexName) return;
      (async () => {
        try {
          const infoState = operationState as ElasticsearchInfoOperationState;
          const infoType = infoState.infoType ?? "mapping";

          const response = await elasticsearch.getIndexInfo(cluster, selectedIndexName, infoType);
          setResponse(JSON.stringify(response, null, 2));
        } catch (error) {
          toast("Failed to get index information.", {
            description: error instanceof Error ? error.message : String(error),
          });
          console.error("Error getting index info:", error);
        }
      })();
    }, [cluster, selectedIndexName, operationState, elasticsearch.getIndexInfo]);

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

    const analyzers = React.useMemo(
      () => (selectedIndex ? extractAnalyzers(selectedIndex) : undefined),
      [selectedIndex],
    );

    const analyzableFields = React.useMemo(
      () => (selectedIndex ? extractAnalyzableFields(selectedIndex.mappings) : undefined),
      [selectedIndex],
    );

    const analyzableFieldNames = React.useMemo(
      () => (analyzableFields ? Object.keys(analyzableFields) : undefined),
      [analyzableFields],
    );

    const renderForm = () => {
      if (operationType === "search") {
        return (
          <QueryEditor
            tabId={tabId}
            indexName={selectedIndexName}
            indexMapping={selectedIndex?.mappings}
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
        );
      }
      if (operationType === "get") {
        return (
          <GetForm
            state={operationState as Partial<ElasticsearchGetOperationState>}
            fields={fields}
            isLoading={elasticsearch.isLoading}
            isRunDisabled={!cluster || !selectedIndexName}
            onStateChange={setOperationState}
            onFieldsSelectionChange={setSelectedFields}
            onRun={handleGet}
          />
        );
      }
      if (operationType === "analyze") {
        return (
          <AnalyzeForm
            state={operationState as Partial<ElasticsearchAnalyzeOperationState>}
            analyzers={analyzers}
            fields={analyzableFieldNames}
            isLoading={elasticsearch.isLoading}
            isRunDisabled={!cluster}
            onStateChange={setOperationState}
            onRun={handleAnalyze}
          />
        );
      }
      if (operationType === "info") {
        return (
          <InfoForm
            state={operationState as Partial<ElasticsearchInfoOperationState>}
            isLoading={elasticsearch.isLoading}
            isRunDisabled={!cluster || !selectedIndexName}
            onStateChange={setOperationState}
            onRun={handleInfo}
          />
        );
      }
      return null;
    };

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
            operationType={operationType}
            onClusterChange={setCluster}
            onIndexChange={setSelectedIndexName}
            onSaveDialogOpenChange={setSaveDialogOpen}
            onOperationTypeChange={setOperationType}
          />
          <PanelGroup direction="horizontal" className="w-full h-full flex-1 min-h-0">
            <Panel className="h-full bg-white/40 p-3 rounded-lg shadow-lg">{renderForm()}</Panel>
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
