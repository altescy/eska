import { atomWithStorage } from "jotai/utils";
import type { EditorSettings } from "@/types/editor";

const EDITOR_SETTINGS_STORAGE_KEY = "eska:v0.0.1:editorSettings";

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on",
  minimap: false,
  keyBinding: "default",
};

export const editorSettingsAtom = atomWithStorage<EditorSettings>(EDITOR_SETTINGS_STORAGE_KEY, DEFAULT_EDITOR_SETTINGS);
