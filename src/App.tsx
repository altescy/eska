import { clsx } from "clsx";
import { Folder, Server, Settings as SettingsIcon } from "lucide-react";
import React from "react";
import { type ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Clusters } from "@/components/Clusters";
import { Settings } from "@/components/Settings";
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
import "@fontsource-variable/fira-code";
import { Collections } from "@/components/Collections";
import { Tabs } from "@/components/Tabs";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [openCollections, setOpenCollections] = React.useState(true);
  const collectionPanelRef = React.useRef<ImperativePanelHandle>(null);

  React.useEffect(() => {
    if (openCollections) {
      collectionPanelRef.current?.expand();
    } else {
      collectionPanelRef.current?.collapse();
    }
  }, [openCollections]);

  const toggleCollections = React.useCallback(() => {
    setOpenCollections((prev) => !prev);
  }, []);

  return (
    <>
      <div className="h-screen w-screen overflow-hidden">
        <div className="w-full h-full flex overflow-hidden text-gray-800">
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
                  onClick={toggleCollections}
                >
                  <Folder />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle collections</TooltipContent>
            </Tooltip>
            <div className="flex-1" />
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon-lg">
                      <SettingsIcon />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">Open settings</TooltipContent>
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
          <PanelGroup direction="horizontal" className="w-full h-full flex-1">
            <Panel
              ref={collectionPanelRef}
              defaultSize={20}
              className="max-w-[300px] w-full flex flex-col"
              collapsible
              collapsedSize={0}
              onCollapse={() => setOpenCollections(false)}
            >
              <div className="h-1 app-region-drag" />
              <Collections className="w-full h-full flex-1 min-h-0 pl-1 pr-2" />
            </Panel>
            <PanelResizeHandle />
            <Panel className="flex flex-col pt-0 pr-2 pb-2 w-full h-full min-h-0">
              <div className="h-1 w-full shrink-0 app-region-drag" />
              <Tabs className="w-full h-full flex-1 min-h-0" />
            </Panel>
          </PanelGroup>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
