import * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";

declare global {
  type JSONValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };
  type JSONSchema = MonacoAPI.languages.json.JSONSchema;
}
