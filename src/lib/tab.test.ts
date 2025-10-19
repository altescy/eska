import { describe, expect, test } from "vitest";
import type { Tab } from "@/types/tab";
import {
  createPlaygroundTab,
  findNextActiveTab,
  getNextTabIndex,
  getPreviousTabIndex,
  getTabTitle,
  reorderTabs,
} from "./tab";

describe("tab", () => {
  describe("getTabTitle", () => {
    test("should return custom title if set", () => {
      const tab: Tab = {
        id: "test-id",
        type: "playground",
        title: "Custom Title",
        state: {
          collectionId: "collection-1",
        },
      };

      expect(getTabTitle(tab)).toBe("Custom Title");
    });

    test("should return cluster and index for search operation", () => {
      const tab: Tab = {
        id: "test-id",
        type: "playground",
        state: {
          collectionId: "collection-1",
          clusterName: "My Cluster",
          operation: {
            type: "search",
            indexName: "my-index",
            query: {},
          },
        },
      };

      expect(getTabTitle(tab)).toBe("My Cluster / my-index");
    });

    test("should return Playground for playground without operation", () => {
      const tab: Tab = {
        id: "test-id",
        type: "playground",
        state: {
          collectionId: "collection-1",
        },
      };

      expect(getTabTitle(tab)).toBe("New Tab");
    });

    test("should return New Tab for empty state", () => {
      const tab: Tab = {
        id: "test-id",
        type: "playground",
        state: {
          collectionId: "collection-1",
        },
      };

      expect(getTabTitle(tab)).toBe("New Tab");
    });
  });

  describe("createPlaygroundTab", () => {
    test("should create tab with default state", () => {
      const tab = createPlaygroundTab();

      expect(tab.id).toBeDefined();
      expect(tab.type).toBe("playground");
      expect(tab.state.collectionId).toBeDefined();
      expect(tab.title).toBe("New Tab");
    });

    test("should create tab with custom state", () => {
      const tab = createPlaygroundTab({
        clusterName: "Test Cluster",
        clusterId: "cluster-123",
        operation: {
          type: "search",
          indexName: "test-index",
          query: {},
        },
      });

      expect(tab.type).toBe("playground");
      expect(tab.state.clusterName).toBe("Test Cluster");
      expect(tab.state.clusterId).toBe("cluster-123");
      expect(tab.state.operation?.type).toBe("search");
      expect(tab.title).toBe("Test Cluster / test-index");
    });
  });

  describe("findNextActiveTab", () => {
    const tabs: Tab[] = [
      { id: "tab1", type: "playground", state: { collectionId: "c1" } },
      { id: "tab2", type: "playground", state: { collectionId: "c2" } },
      { id: "tab3", type: "playground", state: { collectionId: "c3" } },
    ];

    test("should return previous tab when closing middle tab", () => {
      const nextTab = findNextActiveTab(tabs, "tab2");
      expect(nextTab?.id).toBe("tab1");
    });

    test("should return next tab when closing first tab", () => {
      const nextTab = findNextActiveTab(tabs, "tab1");
      expect(nextTab?.id).toBe("tab2");
    });

    test("should return previous tab when closing last tab", () => {
      const nextTab = findNextActiveTab(tabs, "tab3");
      expect(nextTab?.id).toBe("tab2");
    });

    test("should return null when closing non-existent tab", () => {
      const nextTab = findNextActiveTab(tabs, "non-existent");
      expect(nextTab).toBeNull();
    });

    test("should return null when only one tab", () => {
      const singleTab: Tab[] = [{ id: "tab1", type: "playground", state: { collectionId: "c1" } }];
      const nextTab = findNextActiveTab(singleTab, "tab1");
      expect(nextTab).toBeNull();
    });
  });

  describe("getNextTabIndex", () => {
    test("should return next index", () => {
      expect(getNextTabIndex(0, 3)).toBe(1);
      expect(getNextTabIndex(1, 3)).toBe(2);
    });

    test("should wrap around to first index", () => {
      expect(getNextTabIndex(2, 3)).toBe(0);
    });

    test("should return -1 for empty tabs", () => {
      expect(getNextTabIndex(0, 0)).toBe(-1);
    });
  });

  describe("getPreviousTabIndex", () => {
    test("should return previous index", () => {
      expect(getPreviousTabIndex(2, 3)).toBe(1);
      expect(getPreviousTabIndex(1, 3)).toBe(0);
    });

    test("should wrap around to last index", () => {
      expect(getPreviousTabIndex(0, 3)).toBe(2);
    });

    test("should return -1 for empty tabs", () => {
      expect(getPreviousTabIndex(0, 0)).toBe(-1);
    });
  });

  describe("reorderTabs", () => {
    test("should move tab forward", () => {
      const tabs = ["tab1", "tab2", "tab3"];
      const reordered = reorderTabs(tabs, 0, 2);

      expect(reordered).toEqual(["tab2", "tab3", "tab1"]);
    });

    test("should move tab backward", () => {
      const tabs = ["tab1", "tab2", "tab3"];
      const reordered = reorderTabs(tabs, 2, 0);

      expect(reordered).toEqual(["tab3", "tab1", "tab2"]);
    });

    test("should not mutate original array", () => {
      const tabs = ["tab1", "tab2", "tab3"];
      const original = [...tabs];
      reorderTabs(tabs, 0, 2);

      expect(tabs).toEqual(original);
    });
  });
});
