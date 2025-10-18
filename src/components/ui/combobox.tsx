import { clsx } from "clsx";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { cn } from "@/lib/utils";

export interface ComboboxProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: { key: string; value: string; label: React.JSX.Element | string; details?: React.JSX.Element | string }[];
  placeholder?: string;
  onSelectItem?: (selected?: { key: string; value: string }) => void;
  initialKey?: string;
}

export function Combobox({ items = [], placeholder, onSelectItem, initialKey, ...props }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState(initialKey ?? "");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const triggerSize = useResizeObserver(triggerRef);

  React.useEffect(() => {
    if (initialKey !== undefined) {
      setKey(initialKey);
    }
  }, [initialKey]);

  const triggerWidth = React.useMemo(() => triggerSize?.width, [triggerSize]);

  return (
    <div {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between flex items-center bg-transparent border-none rounded-none"
          >
            <div className="truncate">
              {key ? items.find((item) => item.key === key)?.label : placeholder || "Select item..."}
            </div>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={clsx("p-0 overflow-hidden", triggerWidth ? `w-[${triggerWidth}px]` : "w-full")}>
          <Command className={clsx(triggerWidth ? `w-[${triggerWidth}px]` : "w-full")}>
            <CommandInput className="w-full" placeholder="Search item..." />
            <CommandList className="overflow-auto w-full">
              <CommandEmpty>No item found.</CommandEmpty>
              <CommandGroup className="w-full overflow-auto">
                {items.map((item) => (
                  <CommandItem
                    key={item.key}
                    value={item.value}
                    onSelect={(currentValue) => {
                      const selectedItem = items.find((i) => i.value === currentValue);
                      const newKey = selectedItem?.key === key ? "" : (selectedItem?.key ?? "");
                      setKey(newKey);
                      setOpen(false);
                      if (newKey && selectedItem) {
                        onSelectItem?.({ key: selectedItem.key, value: selectedItem.value });
                      } else {
                        onSelectItem?.(undefined);
                      }
                    }}
                  >
                    <CheckIcon className={cn("mr-2 h-4 w-4", key === item.key ? "opacity-100" : "opacity-0")} />
                    <div>
                      {item.label}
                      {item.details && <div className="mt-1">{item.details}</div>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
