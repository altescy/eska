import React from "react";
import { quote } from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type {
  ElaseticsearchSearchResponse,
  ElasticsearchClusterHealthResponse,
  ElasticsearchGetIndicesResponse,
} from "@/types/elasticsearch";

export const useElasticsearch = (cluster: Cluster) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const headers = React.useMemo((): Record<string, string> => {
    if (cluster.auth?.type === "basic") {
      return {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${cluster.auth.username}:${cluster.auth.password}`)}`,
      };
    }
    return { "Content-Type": "application/json" };
  }, [cluster.auth]);

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
        const url = new URL(path, cluster.auth.host);
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
    [cluster.auth, headers],
  );

  const ping = React.useCallback(async () => await request("GET", "/"), [request]);

  const health = React.useCallback(
    async (): Promise<ElasticsearchClusterHealthResponse> => await request("GET", "/_cluster/health"),
    [request],
  );

  const search = React.useCallback(
    async (index: string, query: object): Promise<ElaseticsearchSearchResponse> =>
      await request("POST", `${quote(index)}/_search`, { body: query }),
    [request],
  );

  const getIndices = React.useCallback(
    async (index: string = "*"): Promise<ElasticsearchGetIndicesResponse> => await request("GET", `${quote(index)}`),
    [request],
  );

  return { ping, health, search, getIndices, isLoading };
};
