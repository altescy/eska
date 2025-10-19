import type React from "react";
import { type ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Collections } from "@/features/Collections";
import { Tabs } from "@/features/Tabs";

export interface MainContentProps {
  collectionPanelRef: React.RefObject<ImperativePanelHandle | null>;
  onCollectionsCollapse: () => void;
}

export const MainContent = ({ collectionPanelRef, onCollectionsCollapse }: MainContentProps) => {
  return (
    <PanelGroup direction="horizontal" className="w-full h-full flex-1">
      <Panel
        ref={collectionPanelRef}
        defaultSize={20}
        className="max-w-[300px] w-full flex flex-col"
        collapsible
        collapsedSize={0}
        onCollapse={onCollectionsCollapse}
      >
        <div className="h-1 app-region-drag" />
        <Collections className="w-full h-full flex-1 min-h-0 pl-1 pr-2" />
      </Panel>
      <PanelResizeHandle />
      <Panel className="flex flex-col pt-0 pr-2 pb-2 w-full h-full min-h-0">
        <div className="h-1 w-full shrink-0 app-region-drag" />
        <Tabs className="w-full h-full flex-1 min-h-0" />
      </Panel>
    </PanelGroup>
  );
};
