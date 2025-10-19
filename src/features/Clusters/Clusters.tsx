import { clsx } from "clsx";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClusters } from "@/hooks/useClusters";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import type { Cluster } from "@/types/cluster";
import { ClusterConfig, type ClusterConfigHandler } from "./ClusterConfig";
import { ClusterDetail } from "./ClusterDetail";
import { ClusterList } from "./ClusterList";

export interface ClustersProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Clusters = ({ ...props }: ClustersProps) => {
  const [query, setQuery] = React.useState("");
  const [clusters, setClusters] = useClusters();
  const [selectedCluster, setSelectedCluster] = React.useState<Cluster>();
  const [open, setOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [clusterToDelete, setClusterToDelete] = React.useState<Cluster>();
  const [isTestingConnection, setIsTestingConnection] = React.useState(false);
  const [connectionTestResult, setConnectionTestResult] = React.useState<"success" | "error" | null>(null);
  const dialogRef = React.useRef<ClusterConfigHandler<Cluster>>(null);
  const elasticsearch = useElasticsearch();

  const handleNewCluster = () => {
    setSelectedCluster(undefined);
    setOpen(true);
  };

  const handleSaveConfig = () => {
    const newCluster = dialogRef.current?.getCluster();
    if (newCluster) {
      setClusters((prev) => [...prev.filter((c) => c.id !== newCluster.id), newCluster]);
      setSelectedCluster(newCluster);
    }
    setOpen(false);
  };

  const handleEditCluster = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setOpen(true);
  };

  const handleDeleteCluster = (cluster: Cluster) => {
    setClusterToDelete(cluster);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clusterToDelete) {
      setClusters((prev) => prev.filter((c) => c.id !== clusterToDelete.id));
      if (selectedCluster?.id === clusterToDelete.id) {
        setSelectedCluster(undefined);
      }
    }
    setDeleteDialogOpen(false);
    setClusterToDelete(undefined);
  };

  const handleTestConnection = React.useCallback(async () => {
    const cluster = dialogRef.current?.getCluster();
    if (!cluster) return;

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      await elasticsearch.health(cluster);
      setConnectionTestResult("success");
    } catch (error) {
      setConnectionTestResult("error");
      console.error("Connection test failed:", error);
    } finally {
      setIsTestingConnection(false);
    }
  }, [elasticsearch]);

  React.useEffect(() => {
    if (!open) {
      setConnectionTestResult(null);
    }
  }, [open]);

  const filteredClusters = React.useMemo(() => {
    if (!query) return clusters;
    return clusters
      .filter(
        (cluster) =>
          cluster.name.toLowerCase().includes(query.toLowerCase()) ||
          cluster.auth.host.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clusters, query]);

  return (
    <div {...props}>
      <div className="flex w-full h-full divide-x divide-gray-300/50">
        <ClusterList
          clusters={filteredClusters}
          selectedClusterId={selectedCluster?.id}
          searchQuery={query}
          onSearchChange={setQuery}
          onSelectCluster={setSelectedCluster}
          onAddCluster={handleNewCluster}
        />
        <div className="p-4 flex-1 w-full h-full ml-2 text-gray-800">
          <ClusterDetail cluster={selectedCluster} onEdit={handleEditCluster} onDelete={handleDeleteCluster} />
        </div>
      </div>

      {/* Cluster Config Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col bg-white/65 backdrop-blur-3xl backdrop-brightness-150">
          <DialogHeader>
            <DialogTitle>{selectedCluster ? "Edit Cluster" : "Add Cluster"}</DialogTitle>
            <DialogDescription>
              {selectedCluster
                ? "Edit your Elasticsearch cluster configuration."
                : "Add a new Elasticsearch cluster configuration."}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] pr-2">
            <ClusterConfig ref={dialogRef} initialCluster={selectedCluster} />
          </div>
          {connectionTestResult && (
            <div
              className={clsx(
                "text-sm px-4 py-2 rounded-md",
                connectionTestResult === "success" && "bg-green-100 text-green-800",
                connectionTestResult === "error" && "bg-red-100 text-red-800",
              )}
            >
              {connectionTestResult === "success"
                ? "Connection successful!"
                : "Connection failed. Please check your configuration."}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTestingConnection}>
                  {isTestingConnection ? <Spinner className="mr-2" /> : null}
                  Test Connection
                </Button>
              </TooltipTrigger>
              <TooltipContent>Test connection to cluster</TooltipContent>
            </Tooltip>
            <Button type="submit" onClick={handleSaveConfig}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-[#ffffffa0] backdrop-blur-3xl backdrop-brightness-200">
          <DialogHeader>
            <DialogTitle>Delete Cluster</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the cluster "{clusterToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
