import { Pen, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Cluster } from "@/types/cluster";
import { ClusterInfo } from "./ClusterInfo";

export interface ClusterDetailProps {
  cluster: Cluster | undefined;
  onEdit: (cluster: Cluster) => void;
  onDelete: (cluster: Cluster) => void;
}

export const ClusterDetail = ({ cluster, onEdit, onDelete }: ClusterDetailProps) => {
  if (!cluster) {
    return <div className="text-gray-400">Select a cluster to view its configuration.</div>;
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold">{cluster.name}</h3>
        <div className="grid gap-1 grid-flow-col">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onEdit(cluster)}>
                <Pen />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit cluster</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onDelete(cluster)}>
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete cluster</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ClusterInfo cluster={cluster} />
    </div>
  );
};
