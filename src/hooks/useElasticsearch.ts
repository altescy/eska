import { useAtom } from "jotai";
import React from "react";
import { cachedIndicesAtom } from "@/atoms/elasticsearch";
import { buildElasticsearchHeaders, buildIndexCacheKey, buildUrlWithParams, quote } from "@/lib/elasticsearch";
import type { Cluster } from "@/types/cluster";
import type {
  ElaseticsearchSearchResponse,
  ElasticsearchAnalyzeResponse,
  ElasticsearchClusterHealthResponse,
  ElasticsearchErrorResponse,
  ElasticsearchGetIndicesResponse,
  ElasticsearchGetResponse,
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

  const getDocument = React.useCallback(
    async (
      cluster: Cluster,
      index: string,
      id: string,
      options?: {
        routing?: string;
        preference?: string;
        realtime?: boolean;
        refresh?: boolean;
        version?: number;
        versionType?: string;
        storedFields?: string[];
        _source?: boolean | string[];
        _sourceExcludes?: string[];
      },
    ): Promise<ElasticsearchGetResponse | ElasticsearchErrorResponse> => {
      const params: Record<string, string | number | boolean> = {};
      if (options?.routing) params.routing = options.routing;
      if (options?.preference) params.preference = options.preference;
      if (options?.realtime !== undefined) params.realtime = options.realtime;
      if (options?.refresh !== undefined) params.refresh = options.refresh;
      if (options?.version !== undefined) params.version = options.version;
      if (options?.versionType) params.version_type = options.versionType;
      if (options?.storedFields && options.storedFields.length > 0) {
        params.stored_fields = options.storedFields.join(",");
      }
      if (options?._source === false) {
        params._source = false;
      } else if (Array.isArray(options?._source) && options._source.length > 0) {
        params._source = options._source.join(",");
      }
      if (options?._sourceExcludes && options._sourceExcludes.length > 0) {
        params._source_excludes = options._sourceExcludes.join(",");
      }

      return await request(cluster, "GET", `${quote(index)}/_doc/${quote(id)}`, { params });
    },
    [request],
  );

  const analyzeText = React.useCallback(
    async (
      cluster: Cluster,
      index: string | undefined,
      options: {
        text: string;
        analyzer?: string;
        field?: string;
        tokenizer?: string;
        filter?: string[];
        charFilter?: string[];
        explain?: boolean;
        attributes?: string[];
      },
    ): Promise<ElasticsearchAnalyzeResponse | ElasticsearchErrorResponse> => {
      const body: Record<string, unknown> = {
        text: options.text,
      };
      if (options.analyzer) body.analyzer = options.analyzer;
      if (options.field) body.field = options.field;
      if (options.tokenizer) body.tokenizer = options.tokenizer;
      if (options.filter && options.filter.length > 0) body.filter = options.filter;
      if (options.charFilter && options.charFilter.length > 0) body.char_filter = options.charFilter;
      if (options.explain !== undefined) body.explain = options.explain;
      if (options.attributes && options.attributes.length > 0) body.attributes = options.attributes;

      const path = index ? `${quote(index)}/_analyze` : "/_analyze";
      return await request(cluster, "POST", path, { body });
    },
    [request],
  );

  return { ping, health, search, getIndices, getDocument, analyzeText, isLoading };
};
