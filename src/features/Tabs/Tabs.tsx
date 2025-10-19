import React from "react";
import { useTabs } from "@/hooks/useTabs";
import type { PlaygroundState } from "@/types/playground";
import { TabBar } from "./TabBar";
import { TabContent } from "./TabContent";

const scrollToTab = (tabId: string) => {
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }
};

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

export type TabsHandler = Record<string, never>;

export const Tabs = React.forwardRef<TabsHandler, TabsProps>(({ ...props }, ref) => {
  const tabs = useTabs();

  React.useImperativeHandle(ref, () => ({}), []);

  React.useEffect(() => {
    if (tabs.activeTabId) {
      scrollToTab(tabs.activeTabId);
    }
  }, [tabs.activeTabId]);

  const handleAddTab = React.useCallback(() => {
    const newTab = tabs.newPlaygroundTab();
    tabs.add(newTab);
    tabs.activate(newTab.id);
  }, [tabs]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + T to add new tab
      if ((event.ctrlKey || event.metaKey) && event.key === "t") {
        event.preventDefault();
        handleAddTab();
      }
      // Ctrl/Cmd + W to close active tab
      if ((event.ctrlKey || event.metaKey) && event.key === "w") {
        event.preventDefault();
        if (tabs.activeTabId) {
          tabs.close(tabs.activeTabId);
        }
      }
      // Ctrl/Cmd + Tab to switch to next tab
      if ((event.ctrlKey || event.metaKey) && event.key === "Tab") {
        event.preventDefault();
        if (event.shiftKey) {
          tabs.previous();
        } else {
          tabs.next();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleAddTab, tabs]);

  const handleSelectTab = React.useCallback(
    (tabId: string) => {
      tabs.activate(tabId);
    },
    [tabs],
  );

  const handleCloseTab = React.useCallback(
    (tabId: string) => {
      tabs.close(tabId);
    },
    [tabs],
  );

  const handleReorderTabs = React.useCallback(
    (oldIndex: number, newIndex: number) => {
      tabs.reorder(oldIndex, newIndex);
    },
    [tabs],
  );

  const handleUpdateTabState = React.useCallback(
    (tabId: string, newState: PlaygroundState) => {
      tabs.update(tabId, { state: newState });
    },
    [tabs],
  );

  return (
    <div {...props}>
      <div className="flex flex-col gap-1 w-full h-full">
        <TabBar
          tabs={tabs.tabs}
          activeTabId={tabs.activeTabId}
          getTitle={tabs.title}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onReorderTabs={handleReorderTabs}
          onAddTab={handleAddTab}
        />
        <TabContent tabs={tabs.tabs} activeTabId={tabs.activeTabId} onUpdateTabState={handleUpdateTabState} />
      </div>
    </div>
  );
});
