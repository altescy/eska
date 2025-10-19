import { Activity } from "lucide-react";
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import type { Cluster } from "@/types/cluster";
import type { ElasticsearchClusterHealthResponse } from "@/types/elasticsearch";

export interface ClusterInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  cluster: Cluster;
}

export const ClusterInfo = ({ cluster, ...props }: ClusterInfoProps) => {
  const elasticsearch = useElasticsearch();
  const [health, setHealth] = React.useState<ElasticsearchClusterHealthResponse | Error>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
  React.useEffect(() => {
    (async () => {
      try {
        setHealth(await elasticsearch.health(cluster));
      } catch (error) {
        setHealth(error as Error);
      }
    })();
  }, [elasticsearch.health]);

  return (
    <div {...props}>
      <fieldset className="border-2 border-gray-400/50 rounded-lg py-2 px-6 bg-white/10">
        <legend className="text-lg font-semibold px-4">
          <Activity className="inline-block mr-3" />
          Cluster Health
        </legend>
        {elasticsearch.isLoading ? (
          <Spinner className="m-auto size-5" />
        ) : health ? (
          health instanceof Error ? (
            <p className="text-red-500">Error: {health.message}</p>
          ) : (
            <table className="w-full px-2">
              <tbody>
                {Object.entries(health).map(([key, value]) => (
                  <tr key={key} className="m-2">
                    <td className="font-medium ml-2">{key}</td>
                    <td className="text-right mr-2">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <p>Loading...</p>
        )}
      </fieldset>
    </div>
  );
};
