import React from "react";
import { OperationIcon } from "@/components/Operations";
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
import type { Collection, ElasticsearchCollection } from "@/types/collection";

interface ElasticsearchCollectionViewProps extends React.HTMLAttributes<HTMLDivElement> {
  collection: ElasticsearchCollection;
}

const ElasticsearchCollectionView = ({ collection, ...props }: ElasticsearchCollectionViewProps) => {
  return (
    <div {...props}>
      <h4 className="truncate text-sm">
        <OperationIcon operation={collection.content.type} className="inline-block mr-2 size-4 align-middle" />
        {collection.name}
      </h4>
      <div className="text-xs text-gray-700 truncate mt-1">{collection.content.clusterName}</div>
      <div className="text-xs text-gray-700 truncate mt-1">{collection.content.indexName}</div>
    </div>
  );
};

export interface CollectionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Collections = ({ ...props }: CollectionsProps) => {
  const collections = useCollections();
  const tabs = useTabs();

  const handleClickCollection = React.useCallback(
    (collection: Collection) => {
      if (collection.type === "elasticsearch") {
        let tab = tabs.tabs.find((tab) => tab.state.collection?.id === collection.id);
        if (!tab) {
          tab = tabs.newPlaygroundTab({
            clusterId: collection.content.clusterId,
            clusterName: collection.content.clusterName,
            operation: {
              type: collection.content.type,
              indexName: collection.content.indexName,
              query: collection.content.query,
              response: collection.content.response,
            },
            collection: collection,
          });
          tabs.add(tab);
        }
        tabs.activate(tab.id);
      }
    },
    [tabs],
  );

  return (
    <div {...props}>
      <ul className="divide-y divide-white/20 max-h-full overflow-y-auto">
        {collections.collections.map((collection) => (
          <li key={collection.id} className="select-none py-1">
            {collection.type === "elasticsearch" && (
              <ElasticsearchCollectionView
                collection={collection}
                className="rounded-lg hover:bg-white/35 transition-colors cursor-pointer p-2 min-h-[5rem]"
                onClick={() => handleClickCollection(collection)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export interface SaveCollectionDialogProps {
  children: React.ReactNode;
  collection?: Collection;
  disabled?: boolean;
}

export const SaveCollectionDialog = ({ collection, children, disabled }: SaveCollectionDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(collection?.name);
  const collections = useCollections();

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
    collections.save({
      ...collection,
      name: name,
    });
    setOpen(false);
  }, [collection, name, collections]);

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
