import { useAtom } from "jotai";
import React from "react";
import { activeTabIdAtom, tabsAtom } from "@/atoms/tabs";
import {
  createPlaygroundTab,
  findNextActiveTab,
  getNextTabIndex,
  getPreviousTabIndex,
  getTabTitle,
  reorderTabs,
} from "@/lib/tab";
import type { PlaygroundState } from "@/types/playground";
import type { Tab } from "@/types/tab";

const scrollToTab = (tabId: string) => {
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }
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
        const newActiveTab = findNextActiveTab(prevTabs, tabId);
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

  const next = () => {
    if (!activeTabId || tabs.length === 0) return;
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentIndex === -1) return;
    const nextIndex = getNextTabIndex(currentIndex, tabs.length);
    if (nextIndex !== -1) {
      activate(tabs[nextIndex].id);
    }
  };

  const previous = () => {
    if (!activeTabId || tabs.length === 0) return;
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentIndex === -1) return;
    const previousIndex = getPreviousTabIndex(currentIndex, tabs.length);
    if (previousIndex !== -1) {
      activate(tabs[previousIndex].id);
    }
  };

  const newPlaygroundTab = (state?: Partial<PlaygroundState>): Tab => {
    return createPlaygroundTab(state);
  };

  const reorder = (fromIndex: number, toIndex: number) => {
    setTabs((prevTabs) => reorderTabs(prevTabs, fromIndex, toIndex));
  };

  return {
    tabs,
    activeTabId,
    title,
    add,
    update,
    close,
    activate,
    scrollTo,
    next,
    previous,
    newPlaygroundTab,
    reorder,
  };
};
