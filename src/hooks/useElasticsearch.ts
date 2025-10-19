import { useAtom } from "jotai";
import React from "react";
import { cachedIndicesAtom } from "@/atoms/elasticsearch";
import { buildElasticsearchHeaders, buildIndexCacheKey, buildUrlWithParams, quote } from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type {
  ElaseticsearchSearchResponse,
  ElasticsearchClusterHealthResponse,
  ElasticsearchErrorResponse,
  ElasticsearchGetIndicesResponse,
} from "@/types/elasticsearch";

export const useElasticsearch = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [cachedIndices, setCachedIndices] = useAtom(cachedIndicesAtom);
  const [_portForwardPorts, setPortForwardPorts] = React.useState<Record<string, number>>({});

  // Setup port forward status listener
  React.useEffect(() => {
    const unsubscribe = window.portForward.onStatusChange((status) => {
      if (status.state === "connected" && status.localPort) {
        const port = status.localPort;
        setPortForwardPorts((prev) => ({ ...prev, [status.clusterId]: port }));
      } else if (status.state === "disconnected" || status.state === "error") {
        setPortForwardPorts((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [status.clusterId]: _, ...rest } = prev;
          return rest;
        });
      }
    });

    return unsubscribe;
  }, []);

  const getClusterUrl = React.useCallback(async (cluster: Cluster): Promise<string> => {
    if (!cluster.tunnel || cluster.tunnel.type === "none") {
      return cluster.auth.host;
    }

    // Check if port forward is already connected
    const existingStatus = await window.portForward.getStatus(cluster.id);
    if (existingStatus?.state === "connected" && existingStatus.localPort) {
      return `http://localhost:${existingStatus.localPort}`;
    }

    // Start port forward
    const localPort = await window.portForward.start(cluster.id, cluster.tunnel);
    if (localPort) {
      return `http://localhost:${localPort}`;
    }

    // Fallback to auth.host (shouldn't happen but just in case)
    return cluster.auth.host;
  }, []);

  const getHeaders = React.useCallback((cluster: Cluster): Record<string, string> => {
    return buildElasticsearchHeaders(cluster);
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
        const baseUrl = await getClusterUrl(cluster);
        const url = buildUrlWithParams(baseUrl, path, data?.params);
        const headers = getHeaders(cluster);
        const response = await fetch(url, {
          method,
          headers,
          body: data?.body ? JSON.stringify(data.body) : undefined,
        });
        return response.json();
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders, getClusterUrl],
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
    async (cluster: Cluster, index: string = "*"): Promise<ElasticsearchGetIndicesResponse> => {
      const cacheKey = buildIndexCacheKey(cluster.id, index);
      if (cachedIndices[cacheKey]) {
        return cachedIndices[cacheKey];
      } else {
        const response = await request<ElasticsearchGetIndicesResponse>(cluster, "GET", `${quote(index)}`);
        setCachedIndices((prev) => ({ ...prev, [cacheKey]: response }));
        return response;
      }
    },
    [request, cachedIndices, setCachedIndices],
  );

  return { ping, health, search, getIndices, isLoading };
};
