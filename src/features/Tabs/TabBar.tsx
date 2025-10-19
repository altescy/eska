import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { clsx } from "clsx";
import { Plus, X } from "lucide-react";
import React from "react";
import { OperationIcon } from "@/components/Operations";
import type { Tab } from "@/types/tab";
import { TabItem } from "./TabItem";

export interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null | undefined;
  getTitle: (tab: Tab) => string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (oldIndex: number, newIndex: number) => void;
  onAddTab: () => void;
}

export const TabBar = ({
  tabs,
  activeTabId,
  getTitle,
  onSelectTab,
  onCloseTab,
  onReorderTabs,
  onAddTab,
}: TabBarProps) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動するまでドラッグを開始しない（クリックとの区別）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
      const newIndex = tabs.findIndex((tab) => tab.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderTabs(oldIndex, newIndex);
      }
    }

    setActiveId(null);
  };

  const activeTab = activeId ? tabs.find((tab) => tab.id === activeId) : null;

  return (
    <div className="flex gap-1 shrink-0 w-full h-10 max-w-full overflow-hidden items-center justify-start app-region-drag">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext items={tabs.map((tab) => tab.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 h-9 w-fit overflow-y-hidden overflow-x-auto p-0 scrollbar-none">
            {tabs.map((tab) => (
              <TabItem
                key={tab.id}
                tab={tab}
                isActive={activeTabId === tab.id}
                title={getTitle(tab)}
                onSelect={onSelectTab}
                onClose={onCloseTab}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeTab ? (
            <div
              className={clsx(
                "flex gap-0 items-center h-9 text-sm rounded-lg p-0 select-none shadow-lg cursor-grabbing backdrop-blur-lg",
                activeTabId === activeTab.id ? "bg-white/90" : "bg-white/70",
              )}
            >
              <div className="max-w-xs truncate py-2 pl-2">
                {activeTab.state.operation?.type && (
                  <OperationIcon
                    operation={activeTab.state.operation.type}
                    className="inline-block ml-1 mr-2 h-4 w-4"
                  />
                )}
                {getTitle(activeTab)}
              </div>
              <div className="py-2 pl-1 pr-2">
                <X className="h-4 w-4" />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <button
        type="button"
        onClick={onAddTab}
        className="p-2 shrink-0 hover:bg-white/30 rounded-lg transition-colors select-none"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};
