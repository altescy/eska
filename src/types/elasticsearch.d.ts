export interface ElasticsearchField {
  type: string;
  index?: boolean;
  source?: boolean;
}

export interface ElasticsearchIndexMapping {
  _source?: {
    excludes?: string[];
  };
  properties: {
    [field: string]:
      | {
          properties?: ElasticsearchIndexMapping["properties"];
        }
      | {
          type: string;
          index?: boolean | string;
        };
  };
}

export interface ElasticsearchIndex {
  aliases: { [alias: string]: JSONValue };
  mappings: ElasticsearchIndexMapping;
  settings: { [key: string]: JSONValue };
}

export interface ElasticsearchErrorResponse {
  error: {
    root_cause: Array<{
      type: string;
      reason: string;
    }>;
    type: string;
    reason: string;
  };
  status: number;
}

export interface ElasticsearchClusterHealthResponse {
  cluster_name: string;
  status: "green" | "yellow" | "red";
  timed_out: boolean;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  delayed_unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  task_max_waiting_in_queue_millis: number;
  active_shards_percent_as_number: number;
}

export interface ElaseticsearchSearchResponse<T = JSONValue> {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    total: { value: number; relation: string };
    max_score: number | null;
    hits: T[];
  };
}

export interface ElasticsearchGetIndicesResponse {
  [index: string]: ElasticsearchIndex;
}

export type ElasticsearchOperation = "search";

export interface BaseElasticsearchOperationState<Operation extends ElasticsearchOperation> {
  type: Operation;
}

export interface ElasticsearchSearchOperationState extends BaseOperationState<"search"> {
  type: "search";
  clusterId?: string;
  clusterName?: string;
  indexName?: string;
  query?: string;
  response?: string;
}

export type ElasticsearchOperationState = ElasticsearchSearchOperationState;
