import { clsx } from "clsx";
import { Plus, X } from "lucide-react";
import React from "react";
import { Playground } from "@/components/Playground";
import { useTabs } from "@/hooks/useTabs";
import type { PlaygroundState } from "@/types/playground";
import { OperationIcon } from "./Operations";

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

  const handleUpdatePlaygroundTabState = (tabId: string, newState: PlaygroundState) => {
    tabs.update(tabId, { state: newState });
  };

  return (
    <div {...props}>
      <div className="flex flex-col gap-1 w-full h-full">
        <div className="flex gap-1 shrink-0 w-full h-10 max-w-full overflow-hidden items-center justify-start app-region-drag">
          <div className="flex gap-2 h-9 w-fit overflow-y-hidden overflow-x-auto p-0 scrollbar-none">
            {tabs.tabs.map((tab) => (
              <div
                key={tab.id}
                data-tab-id={tab.id}
                className={clsx(
                  "flex gap-0 items-center h-full text-sm rounded-lg p-0 hover:bg-white/30 transition-colors select-none",
                  tabs.activeTabId === tab.id ? "bg-white/60 hover:bg-white/45" : "bg-white/15",
                )}
              >
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className="max-w-xs truncate py-2 pl-2"
                >
                  {tab.state.operation?.type && (
                    <OperationIcon operation={tab.state.operation.type} className="inline-block ml-1 mr-2 h-4 w-4" />
                  )}
                  {tabs.title(tab)}
                </button>
                <button type="button" onClick={() => handleCloseTab(tab.id)} className="py-2 pl-1 pr-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleAddTab()}
            className="p-2 shrink-0 hover:bg-white/30 rounded-lg transition-colors select-none"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 w-full h-full bg-white/40 rounded-xl p-2">
          {tabs.tabs.map((tab) => (
            <Playground
              key={tab.id}
              collectionId={tab.state.collectionId}
              initialState={tab.state}
              className="w-full h-full min-h-0"
              hidden={tabs.activeTabId !== tab.id}
              onStateChange={(newState) => handleUpdatePlaygroundTabState(tab.id, newState)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
