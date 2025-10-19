import { useAtom } from "jotai";
import { editorSettingsAtom } from "@/atoms/editor";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { SettingItem } from "./SettingItem";

export const EditorSettings = () => {
  const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Editor Settings</h3>
      <div className="space-y-3 mr-1">
        <SettingItem
          label="Font Size"
          description="Adjust editor font size (10-24)"
          control={
            <Input
              type="number"
              min={10}
              max={24}
              value={editorSettings.fontSize}
              onChange={(e) => setEditorSettings({ ...editorSettings, fontSize: Number.parseInt(e.target.value, 10) })}
              className="w-20 border-none bg-gray-100/50"
            />
          }
        />
        <SettingItem
          label="Tab Size"
          description="Set indentation size"
          control={
            <Select
              value={editorSettings.tabSize.toString()}
              onValueChange={(value) => setEditorSettings({ ...editorSettings, tabSize: Number.parseInt(value, 10) })}
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
          }
        />
        <SettingItem
          label="Word Wrap"
          description="Enable word wrapping"
          control={
            <Toggle
              pressed={editorSettings.wordWrap === "on"}
              onPressedChange={(pressed) => setEditorSettings({ ...editorSettings, wordWrap: pressed ? "on" : "off" })}
            >
              {editorSettings.wordWrap === "on" ? "On" : "Off"}
            </Toggle>
          }
        />
        <SettingItem
          label="Minimap"
          description="Show/hide minimap"
          control={
            <Toggle
              pressed={editorSettings.minimap}
              onPressedChange={(pressed) => setEditorSettings({ ...editorSettings, minimap: pressed })}
            >
              {editorSettings.minimap ? "Show" : "Hide"}
            </Toggle>
          }
        />
        <SettingItem
          label="Key Binding"
          description="Select editor key binding mode"
          control={
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
          }
        />
        <SettingItem
          label="Clipboard Format"
          description="Format for copying query to clipboard"
          control={
            <Select
              value={editorSettings.clipboardFormat}
              onValueChange={(value) =>
                setEditorSettings({ ...editorSettings, clipboardFormat: value as "json" | "jsonc" })
              }
            >
              <SelectTrigger className="w-32 border-none bg-gray-100/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="jsonc">JSONC</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>
    </div>
  );
};
