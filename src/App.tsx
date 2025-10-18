import { Folder, Server, Settings } from "lucide-react";
import React from "react";
import { type ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Clusters } from "@/components/Clusters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import "@fontsource-variable/fira-code";
import { Collections } from "@/components/Collections";
import { Tabs } from "@/components/Tabs";

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
    <div className="h-screen w-screen overflow-hidden">
      <div className="w-full h-full flex pt-1 overflow-hidden text-gray-800">
        <div className="pt-10 pb-2 w-[80px] shrink-0 h-full flex flex-col items-center app-region-drag">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-lg">
                <Server />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-white/70 backdrop-blur-2xl backdrop-brightness-150">
              <DialogHeader>
                <DialogTitle>Clusters</DialogTitle>
                <DialogDescription>Manage your Elasticsearch cluster configurations.</DialogDescription>
              </DialogHeader>
              <Clusters className="h-96 overflow-y-auto" />
            </DialogContent>
          </Dialog>
          <Button variant={openCollections ? "secondary" : "ghost"} size="icon-lg" onClick={toggleCollections}>
            <Folder />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon-lg">
            <Settings />
          </Button>
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
            <Collections className="w-full h-full flex-1 min-h-0" />
          </Panel>
          <PanelResizeHandle />
          <Panel className="flex flex-col pt-0 px-2 pb-2 w-full h-full min-h-0">
            <div className="h-2 w-full shrink-0 app-region-drag" />
            <Tabs className="w-full h-full flex-1 min-h-0" />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
