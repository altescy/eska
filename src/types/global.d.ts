import * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import type { TunnelConfig, PortForwardStatus } from "./cluster";

declare global {
  type JSONValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };
  type JSONSchema = MonacoAPI.languages.json.JSONSchema;

  interface Window {
    portForward: {
      start: (clusterId: string, config: TunnelConfig) => Promise<number | null>;
      stop: (clusterId: string) => Promise<void>;
      getStatus: (clusterId: string) => Promise<PortForwardStatus | undefined>;
      getAllStatuses: () => Promise<PortForwardStatus[]>;
      onStatusChange: (callback: (status: PortForwardStatus) => void) => () => void;
    };
  }
}
