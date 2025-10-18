import { Folder, Server, Settings } from "lucide-react";
import React from "react";
import { type ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Clusters } from "@/components/Clusters";
import { Playground } from "@/components/Playground";
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
            className="max-w-[300px] w-full"
            collapsible
            collapsedSize={0}
            onCollapse={() => setOpenCollections(false)}
          >
            <div className="h-1 app-region-drag" />
          </Panel>
          <PanelResizeHandle />
          <Panel className="p-2 flex flex-col w-full h-full min-h-0">
            <div className="h-10 w-full shrink-0 app-region-drag">Tabs</div>
            <Playground className="flex-1 min-h-0 w-full h-full bg-white/40 rounded-2xl p-2" />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
