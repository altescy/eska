import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSettings } from "./DataSettings";
import { EditorSettings } from "./EditorSettings";

export interface SettingsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Settings = ({ ...props }: SettingsProps) => {
  return (
    <div {...props}>
      <Tabs defaultValue="editor" className="w-full h-full text-gray-800">
        <TabsList className="bg-gray-200/50 rounded-md w-full">
          <TabsTrigger value="editor" className="flex-1">
            Editor
          </TabsTrigger>
          <TabsTrigger value="data" className="flex-1">
            Data
          </TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="mt-4 space-y-4">
          <EditorSettings />
        </TabsContent>
        <TabsContent value="data" className="mt-4 space-y-4">
          <DataSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
