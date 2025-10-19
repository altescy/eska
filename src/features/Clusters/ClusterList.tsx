import { clsx } from "clsx";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Cluster } from "@/types/cluster";

export interface ClusterListProps {
  clusters: Cluster[];
  selectedClusterId?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCluster: (cluster: Cluster) => void;
  onAddCluster: () => void;
}

export const ClusterList = ({
  clusters,
  selectedClusterId,
  searchQuery,
  onSearchChange,
  onSelectCluster,
  onAddCluster,
}: ClusterListProps) => {
  return (
    <div className="w-full max-w-[250px] flex-1 flex flex-col px-2">
      <div className="h-fit w-full shrink-0 flex gap-1 pt-1 items-center">
        <InputGroup className="w-full flex-1 border-none outline-none ">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Search clusters..."
            className="border-none outline-none"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onAddCluster} className="px-5 py-2 w-fit shrink-0">
              <Plus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add cluster</TooltipContent>
        </Tooltip>
      </div>
      <ul className="h-full max-h-full overflow-y-auto flex-1 divide-y divide-gray-300/50 mt-2">
        {clusters.map((cluster) => (
          //biome-ignore lint/a11y/useKeyWithClickEvents: Click to select cluster
          <li
            key={cluster.id}
            className={clsx(
              "h-[4rem] p-2 cursor-pointer hover:bg-gray-100/50 rounded-lg",
              cluster.id === selectedClusterId && "bg-white/50",
            )}
            onClick={() => onSelectCluster(cluster)}
          >
            <h5 className="text-gray-800 font-medium truncate">{cluster.name}</h5>
            <p className="text-sm text-gray-500 truncate">{cluster.auth.host}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
