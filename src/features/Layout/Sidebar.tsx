import { clsx } from "clsx";
import { Folder, Server, Settings as SettingsIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clusters } from "@/features/Clusters";
import { Settings } from "@/features/Settings";

export interface SidebarProps {
  openCollections: boolean;
  onToggleCollections: () => void;
}

export const Sidebar = ({ openCollections, onToggleCollections }: SidebarProps) => {
  const [openSettings, setOpenSettings] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + , to open settings
      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        setOpenSettings(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  return (
    <div className="pt-10 pb-2 w-[80px] shrink-0 h-full flex flex-col gap-2 items-center app-region-drag">
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="hover:bg-white/45">
                <Server />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Manage clusters</TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-[800px] bg-white/65 backdrop-blur-3xl backdrop-brightness-150">
          <DialogHeader>
            <DialogTitle>Clusters</DialogTitle>
            <DialogDescription>Manage your Elasticsearch cluster configurations.</DialogDescription>
          </DialogHeader>
          <Clusters className="h-96 overflow-y-auto" />
        </DialogContent>
      </Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className={clsx(openCollections ? "bg-white/60 hover:bg-white/45" : "hover:bg-white/45")}
            onClick={onToggleCollections}
          >
            <Folder />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Toggle collections</TooltipContent>
      </Tooltip>
      <div className="flex-1" />
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-lg">
                <SettingsIcon />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Open settings (⌘,)</TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-[600px] bg-white/65 backdrop-blur-3xl backdrop-brightness-150">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Configure application preferences and manage data.</DialogDescription>
          </DialogHeader>
          <Settings className="h-96 overflow-y-auto" />
        </DialogContent>
      </Dialog>
    </div>
  );
};
