import React from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Toaster } from "@/components/ui/sonner";
import { MainContent, Sidebar } from "@/features/Layout";
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
    <>
      <div className="h-screen w-screen overflow-hidden">
        <div className="w-full h-full flex overflow-hidden text-gray-800">
          <Sidebar openCollections={openCollections} onToggleCollections={toggleCollections} />
          <MainContent
            collectionPanelRef={collectionPanelRef}
            onCollectionsCollapse={() => setOpenCollections(false)}
          />
        </div>
      </div>
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
