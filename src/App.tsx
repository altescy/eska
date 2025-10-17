import { Folder, Server, Settings } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Playground } from "@/components/Playground";
import { Button } from "@/components/ui/button";
import "@fontsource-variable/fira-code";

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="w-full h-full flex pt-1 overflow-hidden text-gray-800">
        <div className="pt-10 pb-2 w-[80px] shrink-0 h-full flex flex-col items-center app-region-drag">
          <Button variant="ghost" size="icon-lg">
            <Server />
          </Button>
          <Button variant="ghost" size="icon-lg">
            <Folder />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon-lg">
            <Settings />
          </Button>
        </div>
        <PanelGroup direction="horizontal" className="w-full h-full flex-1">
          <Panel defaultSize={20} className="min-w-20">
            <div className="h-[1rem] app-region-drag" />
            List
          </Panel>
          <PanelResizeHandle />
          <Panel className="p-2 flex flex-col w-full h-full min-h-0">
            <div className="h-fit w-full shrink-0 app-region-drag">Tabs</div>
            <Playground className="flex-1 min-h-0 w-full h-full bg-white/40 rounded-2xl p-2" />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
