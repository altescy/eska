import { clsx } from "clsx";
import { Playground } from "@/features/Playground";
import type { PlaygroundState } from "@/types/playground";
import type { Tab } from "@/types/tab";

export interface TabContentProps {
  tabs: Tab[];
  activeTabId: string | null | undefined;
  onUpdateTabState: (tabId: string, newState: PlaygroundState) => void;
}

export const TabContent = ({ tabs, activeTabId, onUpdateTabState }: TabContentProps) => {
  return (
    <div className="flex-1 min-h-0 w-full h-full bg-white/40 rounded-xl p-2">
      {tabs.map((tab) => (
        <Playground
          key={tab.id}
          collectionId={tab.state.collectionId}
          initialState={tab.state}
          className={clsx("w-full h-full min-h-0", activeTabId !== tab.id && "hidden")}
          hidden={activeTabId !== tab.id}
          onStateChange={(newState) => onUpdateTabState(tab.id, newState)}
        />
      ))}
    </div>
  );
};
