import { Check, CornerDownRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Cluster } from "@/types/cluster";
import type { Collection } from "@/types/collection";
import type { ElasticsearchGetIndicesResponse } from "@/types/elasticsearch";

import { SaveCollectionDialog } from "./SaveCollectionDialog";

export interface PlaygroundToolbarProps {
  clusters: Cluster[];
  selectedCluster?: Cluster;
  indices?: ElasticsearchGetIndicesResponse;
  selectedIndexName?: string;
  collection: Collection;
  saveDialogOpen: boolean;
  isSaved: boolean;
  isLoadingIndices: boolean;
  onClusterChange: (cluster: Cluster | undefined) => void;
  onIndexChange: (indexName: string | undefined) => void;
  onSaveDialogOpenChange: (open: boolean) => void;
}

export const PlaygroundToolbar = ({
  clusters,
  selectedCluster,
  indices,
  selectedIndexName,
  collection,
  saveDialogOpen,
  isSaved,
  isLoadingIndices,
  onClusterChange,
  onIndexChange,
  onSaveDialogOpenChange,
}: PlaygroundToolbarProps) => {
  return (
    <div className="h-fit w-full shrink-0 flex gap-1">
      <Combobox
        initialKey={selectedCluster?.id}
        items={clusters.map((c) => ({
          key: c.id,
          value: c.id,
          label: c.name,
          details: <div className="text-xs text-gray-400">{c.auth.host}</div>,
        }))}
        placeholder="Select cluster"
        onSelectItem={(selected) => onClusterChange(clusters.find((c) => c.id === selected?.key))}
        className="w-[200px] shrink-0 bg-white/40 rounded-l-lg overflow-hidden"
      />
      <Select defaultValue="search">
        <SelectTrigger className="w-[120px] shrink-0 border-none bg-white/40 rounded-none rounded-r-none">
          <SelectValue placeholder="Select operation" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Operation</SelectLabel>
            <SelectItem value="search">SEARCH</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Combobox
        initialKey={selectedIndexName}
        items={[
          // Create items for indices
          ...Object.entries(indices ?? {}).map(([name, index]) => ({
            key: name,
            value: name,
            label: name,
            details: (
              <div className="text-xs text-gray-500">
                {Object.keys(index.aliases).length > 0
                  ? Object.keys(index.aliases).map((alias) => (
                      <div key={alias} className="ml-2">
                        {alias}
                      </div>
                    ))
                  : "Index"}
              </div>
            ),
          })),
          // Create items for aliases
          ...Object.entries(indices ?? {}).flatMap(([indexName, index]) =>
            Object.keys(index.aliases).map((alias) => ({
              key: alias,
              value: alias,
              label: alias,
              details: (
                <div className="text-xs text-gray-500">
                  <CornerDownRight className="text-gray-400 inline-block -translate-y-0.5" /> {indexName}
                </div>
              ),
            })),
          ),
        ]}
        placeholder={isLoadingIndices ? "Loading indices..." : "Select index or alias"}
        onSelectItem={(selected) => onIndexChange(selected?.key)}
        className="bg-white/40  rounded-l-none rounded-r-lg w-full overflow-hidden"
      />
      <SaveCollectionDialog collection={collection} open={saveDialogOpen} onOpenChange={onSaveDialogOpenChange}>
        <Button variant="ghost" size="icon" disabled={isSaved} className="text-gray-600">
          {isSaved ? <Check /> : <Save />}
        </Button>
      </SaveCollectionDialog>
    </div>
  );
};
