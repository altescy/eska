import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: { key: string; value: string; label: React.JSX.Element | string; details?: React.JSX.Element | string }[];
  placeholder?: string;
  onSelectItem?: (key: string, value: string) => void;
}

export function Combobox({ items = [], placeholder, onSelectItem, ...props }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState("");

  React.useEffect(() => {
    const selectedItem = items.find((item) => item.key === key);
    if (selectedItem) onSelectItem?.(selectedItem.key, selectedItem.value);
  }, [key, items, onSelectItem]);

  return (
    <div {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between flex items-center"
          >
            <div className="truncate">
              {key ? items.find((item) => item.key === key)?.label : placeholder || "Select item..."}
            </div>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 overflow-hidden">
          <Command className="w-full">
            <CommandInput className="w-full" placeholder="Search framework..." />
            <CommandList className="w-full overflow-auto">
              <CommandEmpty>No item found.</CommandEmpty>
              <CommandGroup className="max-w-full overflow-auto">
                {items.map((item) => (
                  <CommandItem
                    key={item.key}
                    value={item.value}
                    onSelect={(currentKey) => {
                      setKey(currentKey === key ? "" : currentKey);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon className={cn("mr-2 h-4 w-4", key === item.key ? "opacity-100" : "opacity-0")} />
                    <div>
                      {item.label}
                      {item.details && <div className="ml-2 mt-1">{item.details}</div>}
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
