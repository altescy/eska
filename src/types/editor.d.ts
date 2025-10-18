export type KeyBinding = "default" | "vim";

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
  keyBinding: KeyBinding;
}
