import { useAtom } from "jotai";
import { Download, Upload } from "lucide-react";
import type React from "react";
import { editorSettingsAtom } from "@/atoms/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SettingsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Settings = ({ ...props }: SettingsProps) => {
  const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);

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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Editor Settings</h3>
            <div className="space-y-3 mr-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Font Size</div>
                  <div className="text-sm text-muted-foreground">Adjust editor font size (10-24)</div>
                </div>
                <Input
                  type="number"
                  min={10}
                  max={24}
                  value={editorSettings.fontSize}
                  onChange={(e) =>
                    setEditorSettings({ ...editorSettings, fontSize: Number.parseInt(e.target.value, 10) })
                  }
                  className="w-20 border-none bg-gray-100/50"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Tab Size</div>
                  <div className="text-sm text-muted-foreground">Set indentation size</div>
                </div>
                <Select
                  value={editorSettings.tabSize.toString()}
                  onValueChange={(value) =>
                    setEditorSettings({ ...editorSettings, tabSize: Number.parseInt(value, 10) })
                  }
                >
                  <SelectTrigger className="w-20 border-none bg-gray-100/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Word Wrap</div>
                  <div className="text-sm text-muted-foreground">Enable word wrapping</div>
                </div>
                <Toggle
                  pressed={editorSettings.wordWrap === "on"}
                  onPressedChange={(pressed) =>
                    setEditorSettings({ ...editorSettings, wordWrap: pressed ? "on" : "off" })
                  }
                >
                  {editorSettings.wordWrap === "on" ? "On" : "Off"}
                </Toggle>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Minimap</div>
                  <div className="text-sm text-muted-foreground">Show/hide minimap</div>
                </div>
                <Toggle
                  pressed={editorSettings.minimap}
                  onPressedChange={(pressed) => setEditorSettings({ ...editorSettings, minimap: pressed })}
                >
                  {editorSettings.minimap ? "Show" : "Hide"}
                </Toggle>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Key Binding</div>
                  <div className="text-sm text-muted-foreground">Select editor key binding mode</div>
                </div>
                <Select
                  value={editorSettings.keyBinding}
                  onValueChange={(value) =>
                    setEditorSettings({ ...editorSettings, keyBinding: value as "default" | "vim" })
                  }
                >
                  <SelectTrigger className="w-32 border-none bg-gray-100/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="vim">Vim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="data" className="mt-4 space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Application Data</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-muted-foreground">Export clusters, collections, and settings</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export application data</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Import Data</div>
                  <div className="text-sm text-muted-foreground">Import data from a backup file</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Import application data</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Clear All Data</div>
                  <div className="text-sm text-muted-foreground">Remove all application data (cannot be undone)</div>
                </div>
                <Button variant="destructive" size="sm" disabled>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
