import { describe, expect, test } from "vitest";
import type { Cluster } from "@/types/cluster";
import { migrateCluster, migrateClusters } from "./cluster";

describe("cluster", () => {
  describe("migrateCluster", () => {
    test("should add tunnel field to cluster without tunnel", () => {
      const cluster = {
        id: "test-id",
        name: "Test Cluster",
        auth: { type: "noauth" as const, host: "http://localhost:9200" },
      } as Cluster;

      const migrated = migrateCluster(cluster);

      expect(migrated).toEqual({
        id: "test-id",
        name: "Test Cluster",
        auth: { type: "noauth", host: "http://localhost:9200" },
        tunnel: { type: "none" },
      });
    });

    test("should preserve existing tunnel field", () => {
      const cluster: Cluster = {
        id: "test-id",
        name: "Test Cluster",
        auth: { type: "noauth", host: "http://localhost:9200" },
        tunnel: {
          type: "ssh",
          host: "ssh.example.com",
          port: 22,
          username: "user",
          authMethod: "key",
          remoteHost: "localhost",
          remotePort: 9200,
        },
      };

      const migrated = migrateCluster(cluster);

      expect(migrated).toEqual(cluster);
    });
  });

  describe("migrateClusters", () => {
    test("should migrate multiple clusters", () => {
      const clusters = [
        {
          id: "test-id-1",
          name: "Test Cluster 1",
          auth: { type: "noauth" as const, host: "http://localhost:9200" },
        },
        {
          id: "test-id-2",
          name: "Test Cluster 2",
          auth: { type: "basic" as const, host: "http://localhost:9200", username: "user", password: "pass" },
          tunnel: { type: "none" as const },
        },
      ] as Cluster[];

      const migrated = migrateClusters(clusters);

      expect(migrated).toEqual([
        {
          id: "test-id-1",
          name: "Test Cluster 1",
          auth: { type: "noauth", host: "http://localhost:9200" },
          tunnel: { type: "none" },
        },
        {
          id: "test-id-2",
          name: "Test Cluster 2",
          auth: { type: "basic", host: "http://localhost:9200", username: "user", password: "pass" },
          tunnel: { type: "none" },
        },
      ]);
    });

    test("should handle empty array", () => {
      const migrated = migrateClusters([]);
      expect(migrated).toEqual([]);
    });
  });
});
