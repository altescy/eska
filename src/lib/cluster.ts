import type { Cluster } from "@/types/cluster";

/**
 * Migrate legacy cluster data to current schema.
 * Adds missing tunnel field with default value.
 */
export function migrateCluster(cluster: Cluster): Cluster {
  if (!cluster.tunnel) {
    return { ...cluster, tunnel: { type: "none" } };
  }
  return cluster;
}

/**
 * Migrate an array of clusters to current schema.
 */
export function migrateClusters(clusters: Cluster[]): Cluster[] {
  return clusters.map(migrateCluster);
}
