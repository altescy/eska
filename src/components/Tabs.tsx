import { clsx } from "clsx";
import { useAtom } from "jotai";
import { Plus, X } from "lucide-react";
import React from "react";
import { activeTabIdAtom, tabsAtom } from "@/atoms/tabs";
import { Playground } from "@/components/Playground";
import { uuid4 } from "@/lib/uuid";
import type { PlaygroundState } from "@/types/playground";
import type { Tab } from "@/types/tab";

const scrollToTab = (tabId: string) => {
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }
};

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

export type TabsHandler = Record<string, never>;

export const Tabs = React.forwardRef<TabsHandler, TabsProps>(({ ...props }, ref) => {
  const [tabs, setTabs] = useAtom(tabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);

  React.useImperativeHandle(ref, () => ({}), []);

  React.useEffect(() => {
    if (activeTabId) {
      scrollToTab(activeTabId);
    }
  }, [activeTabId]);

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleAddTab = () => {
    setTabs((prevTabs) => {
      const newTab: Tab = { id: uuid4(), type: "playground", state: {} };
      setActiveTabId(newTab.id);
      return [...prevTabs, newTab];
    });
  };

  const handleCloseTab = (tabId: string) => {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));
    if (activeTabId === tabId) {
      const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
      const newActiveTab = tabs[tabIndex - 1] || tabs[tabIndex + 1];
      setActiveTabId(newActiveTab ? newActiveTab.id : null);
    }
  };

  const handleUpdatePlaygroundTabState = (tabId: string, newState: PlaygroundState) => {
    console.log("Updating tab state for tabId:", tabId, "with newState:", newState);
    setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === tabId ? { ...tab, state: newState } : tab)));
  };

  return (
    <div {...props}>
      <div className="flex flex-col gap-2 w-full h-full">
        <div className="flex gap-2 shrink-0 w-full h-10 max-w-full overflow-hidden items-center justify-start app-region-drag">
          <div className="flex gap-2 h-full w-fit overflow-x-auto p-0 scrollbar-none">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                data-tab-id={tab.id}
                className={clsx(
                  "flex gap-0 items-center h-full text-sm rounded-lg p-0 hover:bg-white/30 transition-colors select-none",
                  activeTabId === tab.id ? "bg-white/60 hover:bg-white/45" : "bg-white/15",
                )}
              >
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className="max-w-xs truncate py-2 pl-2"
                >
                  {tab.type.charAt(0).toUpperCase() + tab.type.slice(1)}
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
          {tabs.map((tab) => (
            <Playground
              key={tab.id}
              initialState={tab.state}
              className="w-full h-full min-h-0"
              hidden={activeTabId !== tab.id}
              onStateChange={(newState) => handleUpdatePlaygroundTabState(tab.id, newState)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
