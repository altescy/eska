export interface ElasticsearchBasicAuth {
  type: "basic";
  username: string;
  password: string;
}

export type ElasticsearchAuth = ElasticsearchBasicAuth;

export interface ElasticsearchConfig {
  host: string;
  auth?: ElasticsearchAuth;
}

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
