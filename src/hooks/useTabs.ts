import { useAtom } from "jotai";
import React from "react";
import { activeTabIdAtom, tabsAtom } from "@/atoms/tabs";
import { uuid4 } from "@/lib/uuid";
import type { PlaygroundState } from "@/types/playground";
import type { Tab } from "@/types/tab";

const scrollToTab = (tabId: string) => {
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }
};

const getTabTitle = (tab: Tab): string => {
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
};

export const useTabs = () => {
  const [tabs, setTabs] = useAtom(tabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);

  React.useEffect(() => {
    if (activeTabId) {
      scrollToTab(activeTabId);
    }
  }, [activeTabId]);

  const title = React.useCallback((tab: Tab) => getTabTitle(tab), []);

  const add = (tab: Tab) => setTabs((prevTabs) => [...prevTabs, tab]);

  const update = (tabId: string, updatedFields: Partial<Tab>) => {
    setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === tabId ? { ...tab, ...updatedFields } : tab)));
  };

  const close = (tabId: string) => {
    setTabs((prevTabs) => {
      if (activeTabId === tabId) {
        const tabIndex = prevTabs.findIndex((tab) => tab.id === tabId);
        const newActiveTab = prevTabs[tabIndex - 1] || prevTabs[tabIndex + 1];
        setActiveTabId(newActiveTab ? newActiveTab.id : null);
      }
      return prevTabs.filter((tab) => tab.id !== tabId);
    });
  };

  const activate = (tabId: string) => {
    setActiveTabId(tabId);
    scrollToTab(tabId);
  };

  const scrollTo = (tabId: string) => scrollToTab(tabId);

  const newPlaygroundTab = (state?: Partial<PlaygroundState>): Tab => {
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
  };

  return { tabs, activeTabId, title, add, update, close, activate, scrollTo, newPlaygroundTab };
};
