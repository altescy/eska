import { uuid4 } from "@/lib/uuid";
import type { PlaygroundState } from "@/types/playground";
import type { Tab } from "@/types/tab";

/**
 * Generate a display title for a tab based on its type and state
 */
export function getTabTitle(tab: Tab): string {
  if (tab.title) {
    return tab.title;
  }
  if (tab.type === "playground") {
    if (tab.state.operation) {
      switch (tab.state.operation.type) {
        case "search":
          return `${tab.state.clusterName ?? "No cluster"} / ${tab.state.operation.indexName ?? "No index"}`.trim();
        default:
          return "Playground";
      }
    }
  }
  return "New Tab";
}

/**
 * Create a new playground tab with optional initial state
 */
export function createPlaygroundTab(state?: Partial<PlaygroundState>): Tab {
  const tab: Tab = {
    id: uuid4(),
    type: "playground",
    state: {
      collectionId: uuid4(),
      ...state,
    },
  };
  tab.title = getTabTitle(tab);
  return tab;
}

/**
 * Find the next active tab when closing a tab
 * Returns the previous tab if available, otherwise the next tab
 */
export function findNextActiveTab(tabs: Tab[], closingTabId: string): Tab | null {
  const tabIndex = tabs.findIndex((tab) => tab.id === closingTabId);
  if (tabIndex === -1) return null;

  const newActiveTab = tabs[tabIndex - 1] || tabs[tabIndex + 1];
  return newActiveTab || null;
}

/**
 * Calculate the next tab index in a circular manner
 */
export function getNextTabIndex(currentIndex: number, totalTabs: number): number {
  if (totalTabs === 0) return -1;
  return (currentIndex + 1) % totalTabs;
}

/**
 * Calculate the previous tab index in a circular manner
 */
export function getPreviousTabIndex(currentIndex: number, totalTabs: number): number {
  if (totalTabs === 0) return -1;
  return (currentIndex - 1 + totalTabs) % totalTabs;
}

/**
 * Reorder tabs array by moving an item from one index to another
 */
export function reorderTabs<T>(tabs: T[], fromIndex: number, toIndex: number): T[] {
  const newTabs = [...tabs];
  const [movedTab] = newTabs.splice(fromIndex, 1);
  newTabs.splice(toIndex, 0, movedTab);
  return newTabs;
}
