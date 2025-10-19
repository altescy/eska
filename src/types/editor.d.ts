export type KeyBinding = "default" | "vim";
export type ClipboardFormat = "json" | "jsonc";

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
  keyBinding: KeyBinding;
  clipboardFormat: ClipboardFormat;
}
