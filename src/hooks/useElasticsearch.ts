import React from "react";
import type { ElasticsearchIndex } from "@/lib/elasticsearch";

export interface ElasticsearchBasicAuth {
  type: "basic";
  username: string;
  password: string;
}

export type ElasticsearchAuth = ElasticsearchBasicAuth;

export interface ElasticsearchConfig {
  host: string;
  auth: ElasticsearchAuth;
}

const quote = (str: string) => encodeURIComponent(str);

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

export const useElasticsearch = (config: ElasticsearchConfig) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const headers = React.useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${config.auth.username}:${config.auth.password}`)}`,
    };
  }, [config.auth]);

  const request = React.useCallback(
    async <Response>(
      method: string,
      path: string,
      data?: {
        params?: Record<string, string | number | boolean>;
        body?: object;
      },
    ): Promise<Response> => {
      try {
        setIsLoading(true);
        const url = new URL(`${config.host}/${path}`);
        if (data?.params) {
          Object.entries(data.params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
          });
        }
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: data?.body ? JSON.stringify(data.body) : undefined,
        });
        if (!response.ok) {
          throw new Error(`Elasticsearch request failed: ${response.statusText}`);
        }
        return response.json();
      } finally {
        setIsLoading(false);
      }
    },
    [config.host, headers],
  );

  const search = React.useCallback(
    async (index: string, query: object) =>
      await request<ElaseticsearchSearchResponse>("POST", `${quote(index)}/_search`, { body: query }),
    [request],
  );

  const getIndices = React.useCallback(
    async (index: string = "*") => await request<ElasticsearchGetIndicesResponse>("GET", `${quote(index)}`),
    [request],
  );

  return { search, getIndices, isLoading };
};
