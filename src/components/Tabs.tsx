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
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { Plus, X } from "lucide-react";
import React from "react";
import { Playground } from "@/components/Playground";
import { useTabs } from "@/hooks/useTabs";
import type { PlaygroundState } from "@/types/playground";
import type { Tab } from "@/types/tab";
import { OperationIcon } from "./Operations";

const scrollToTab = (tabId: string) => {
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }
};

interface SortableTabItemProps {
  tab: Tab;
  isActive: boolean;
  title: string;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

const SortableTabItem = ({ tab, isActive, title, onSelect, onClose }: SortableTabItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-tab-id={tab.id}
      className={clsx(
        "flex gap-0 items-center h-full text-sm rounded-lg p-0 hover:bg-white/30 transition-colors select-none",
        isActive ? "bg-white/60 hover:bg-white/45" : "bg-white/15",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(tab.id)}
        className="max-w-xs truncate py-2 pl-2"
        {...attributes}
        {...listeners}
      >
        {tab.state.operation?.type && (
          <OperationIcon operation={tab.state.operation.type} className="inline-block ml-1 mr-2 h-4 w-4" />
        )}
        {title}
      </button>
      <button type="button" onClick={() => onClose(tab.id)} className="py-2 pl-1 pr-2">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

export type TabsHandler = Record<string, never>;

export const Tabs = React.forwardRef<TabsHandler, TabsProps>(({ ...props }, ref) => {
  const tabs = useTabs();
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tabs.tabs.findIndex((tab) => tab.id === active.id);
      const newIndex = tabs.tabs.findIndex((tab) => tab.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        tabs.reorder(oldIndex, newIndex);
      }
    }

    setActiveId(null);
  };

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

  const handleUpdatePlaygroundTabState = (tabId: string, newState: PlaygroundState) => {
    tabs.update(tabId, { state: newState });
  };

  const activeTab = activeId ? tabs.tabs.find((tab) => tab.id === activeId) : null;

  return (
    <div {...props}>
      <div className="flex flex-col gap-1 w-full h-full">
        <div className="flex gap-1 shrink-0 w-full h-10 max-w-full overflow-hidden items-center justify-start app-region-drag">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis]}
          >
            <SortableContext items={tabs.tabs.map((tab) => tab.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-2 h-9 w-fit overflow-y-hidden overflow-x-auto p-0 scrollbar-none">
                {tabs.tabs.map((tab) => (
                  <SortableTabItem
                    key={tab.id}
                    tab={tab}
                    isActive={tabs.activeTabId === tab.id}
                    title={tabs.title(tab)}
                    onSelect={handleSelectTab}
                    onClose={handleCloseTab}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeTab ? (
                <div
                  className={clsx(
                    "flex gap-0 items-center h-9 text-sm rounded-lg p-0 select-none shadow-lg cursor-grabbing backdrop-blur-lg",
                    tabs.activeTabId === activeTab.id ? "bg-white/90" : "bg-white/70",
                  )}
                >
                  <div className="max-w-xs truncate py-2 pl-2">
                    {activeTab.state.operation?.type && (
                      <OperationIcon
                        operation={activeTab.state.operation.type}
                        className="inline-block ml-1 mr-2 h-4 w-4"
                      />
                    )}
                    {tabs.title(activeTab)}
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
              className={clsx("w-full h-full min-h-0", tabs.activeTabId !== tab.id && "hidden")}
              hidden={tabs.activeTabId !== tab.id}
              onStateChange={(newState) => handleUpdatePlaygroundTabState(tab.id, newState)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
