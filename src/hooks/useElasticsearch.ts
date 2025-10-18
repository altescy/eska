import React from "react";
import { quote } from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type {
  ElaseticsearchSearchResponse,
  ElasticsearchClusterHealthResponse,
  ElasticsearchErrorResponse,
  ElasticsearchGetIndicesResponse,
} from "@/types/elasticsearch";

export const useElasticsearch = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const getHeaders = React.useCallback((cluster: Cluster): Record<string, string> => {
    if (!cluster) return {};
    if (cluster.auth?.type === "basic") {
      return {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${cluster.auth.username}:${cluster.auth.password}`)}`,
      };
    }
    return { "Content-Type": "application/json" };
  }, []);

  const request = React.useCallback(
    async <Response>(
      cluster: Cluster,
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
        const headers = getHeaders(cluster);
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: data?.body ? JSON.stringify(data.body) : undefined,
        });
        return response.json();
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders],
  );

  const ping = React.useCallback(async (cluster: Cluster) => await request(cluster, "GET", "/"), [request]);

  const health = React.useCallback(
    async (cluster: Cluster): Promise<ElasticsearchClusterHealthResponse> =>
      await request(cluster, "GET", "/_cluster/health"),
    [request],
  );

  const search = React.useCallback(
    async (
      cluster: Cluster,
      index: string,
      query: object,
    ): Promise<ElaseticsearchSearchResponse | ElasticsearchErrorResponse> =>
      await request(cluster, "POST", `${quote(index)}/_search`, { body: query }),
    [request],
  );

  const getIndices = React.useCallback(
    async (cluster: Cluster, index: string = "*"): Promise<ElasticsearchGetIndicesResponse> =>
      await request(cluster, "GET", `${quote(index)}`),
    [request],
  );

  return { ping, health, search, getIndices, isLoading };
};
