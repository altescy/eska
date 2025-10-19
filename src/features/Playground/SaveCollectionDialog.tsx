import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCollections } from "@/hooks/useCollections";
import { useTabs } from "@/hooks/useTabs";
import type { Collection } from "@/types/collection";

export interface SaveCollectionDialogProps {
  children: React.ReactNode;
  collection?: Collection;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (collection: Collection) => void;
}

export const SaveCollectionDialog = ({
  collection,
  children,
  disabled,
  open: controlledOpen,
  onOpenChange,
  onSave,
}: SaveCollectionDialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [name, setName] = React.useState(collection?.name);
  const collections = useCollections();
  const tabs = useTabs();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  React.useEffect(() => {
    setName(collection?.name);
  }, [collection]);

  const isValid = React.useMemo(() => {
    return name && name.trim() !== "";
  }, [name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSave = React.useCallback(() => {
    if (!name || !collection) return;
    const newCollection: Collection = { ...collection, name: name };
    collections.save(newCollection);

    const tab = tabs.tabs.find((tab) => tab.state.collectionId === collection.id);
    if (tab) tabs.update(tab.id, { title: name });

    onSave?.(newCollection);
    setOpen(false);
  }, [collection, name, collections, onSave, tabs, setOpen]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Collection</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 w-full">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              value={name}
              onChange={handleNameChange}
              className="col-span-3 w-full"
              placeholder="Collection Name"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="mr-2">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!isValid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
