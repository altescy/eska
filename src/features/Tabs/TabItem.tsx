import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { X } from "lucide-react";
import { OperationIcon } from "@/components/Operations";
import type { Tab } from "@/types/tab";

export interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  title: string;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export const TabItem = ({ tab, isActive, title, onSelect, onClose }: TabItemProps) => {
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
