import { ListFilter } from "lucide-react";
import React from "react";
import { OperationIcon } from "@/components/Operations";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
  const [query, setQuery] = React.useState("");
  const collections = useCollections();
  const tabs = useTabs();

  const handleClickCollection = React.useCallback(
    (collection: Collection) => {
      if (collection.type === "elasticsearch") {
        let tab = tabs.tabs.find((tab) => tab.state.collectionId === collection.id);
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
            collectionId: collection.id,
          });
          tab.title = collection.name;
          tabs.add(tab);
        }
        tabs.activate(tab.id);
      }
    },
    [tabs],
  );

  const filteredCollections = React.useMemo(() => {
    if (query.trim() === "") {
      return collections.collections;
    }
    return collections.search(query).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [collections, query]);

  const handleDeleteCollection = React.useCallback(
    (collectionId: string) => {
      collections.remove(collectionId);
      const tab = tabs.tabs.find((tab) => tab.state.collectionId === collectionId);
      if (tab) tabs.close(tab.id);
    },
    [collections, tabs],
  );

  return (
    <div {...props}>
      <div className="w-full h-full flex flex-col">
        <InputGroup className="mt-1 h-9 outline-none border-none bg-white/15 rounded-md">
          <InputGroupAddon>
            <ListFilter />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections..."
            className="flex-1 border-none outline-none"
          />
        </InputGroup>
        <ul className="divide-y divide-white/20 max-h-full overflow-y-auto flex-1 min-h-0">
          {filteredCollections.map((collection) => (
            <li key={collection.id} className="select-none py-1">
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  {collection.type === "elasticsearch" && (
                    <ElasticsearchCollectionView
                      collection={collection}
                      className="rounded-lg hover:bg-white/35 transition-colors cursor-pointer px-3 py-2 min-h-[5rem]"
                      onClick={() => handleClickCollection(collection)}
                    />
                  )}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => handleDeleteCollection(collection.id)}>
                    Delete Collection
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
