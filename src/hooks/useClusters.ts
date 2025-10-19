import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { clustersAtom } from "@/atoms/clusters";
import { decryptData, encryptData } from "@/lib/secureStorage";
import type { Cluster } from "@/types/cluster";

export function useClusters() {
  const [encryptedClusters, setEncryptedClusters] = useAtom(clustersAtom);
  const [clusters, setClustersState] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Decrypt clusters when encrypted data changes
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      if (!encryptedClusters) {
        setClustersState([]);
        setIsLoading(false);
        return;
      }

      const decrypted = await decryptData<Cluster[]>(encryptedClusters);
      // Migration: add tunnel field to existing clusters if missing
      const migrated = (decrypted ?? []).map((cluster) => {
        if (!cluster.tunnel) {
          return { ...cluster, tunnel: { type: "none" as const } };
        }
        return cluster;
      });
      setClustersState(migrated);
      setIsLoading(false);
    })();
  }, [encryptedClusters]);

  // Function to update clusters
  const setClusters = async (newClusters: Cluster[] | ((prev: Cluster[]) => Cluster[])) => {
    const updatedClusters = typeof newClusters === "function" ? newClusters(clusters) : newClusters;
    const encrypted = await encryptData(updatedClusters);
    setEncryptedClusters(encrypted);
  };

  return [clusters, setClusters, isLoading] as const;
}
