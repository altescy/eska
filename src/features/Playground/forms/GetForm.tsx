import { Info, Play } from "lucide-react";
import { useEffect, useId } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ElasticsearchField, ElasticsearchGetOperationState } from "@/types/elasticsearch";

import { Fields } from "../Fields";

export interface GetFormProps {
  state: Partial<ElasticsearchGetOperationState>;
  fields?: Record<string, ElasticsearchField>;
  isLoading?: boolean;
  isRunDisabled?: boolean;
  onStateChange: (state: Partial<ElasticsearchGetOperationState>) => void;
  onFieldsSelectionChange?: (fields: string[]) => void;
  onRun: () => void;
}

export const GetForm = ({
  state,
  fields,
  isLoading = false,
  isRunDisabled = false,
  onStateChange,
  onFieldsSelectionChange,
  onRun,
}: GetFormProps) => {
  const documentIdId = useId();
  const routingId = useId();
  const preferenceId = useId();
  const realtimeId = useId();
  const refreshId = useId();
  const sourceExcludesId = useId();
  const storedFieldsId = useId();
  const versionId = useId();

  const handleChange = (field: keyof ElasticsearchGetOperationState, value: unknown) => {
    onStateChange({ ...state, [field]: value });
  };

  // Cmd/Ctrl + Enter to run
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (!isRunDisabled && !isLoading && state.documentId) {
          onRun();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRun, isRunDisabled, isLoading, state.documentId]);

  return (
    <PanelGroup direction="vertical" className="w-full h-full">
      <Panel className="w-full h-full flex-1">
        <div className="flex flex-row gap-4 h-full w-full">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Document ID */}
            <div className="space-y-2">
              <label htmlFor={documentIdId} className="text-sm font-medium">
                Document ID *
              </label>
              <Input
                id={documentIdId}
                value={state.documentId ?? ""}
                onChange={(e) => handleChange("documentId", e.target.value)}
                placeholder="Enter document ID"
              />
            </div>

            {/* Routing */}
            <div className="space-y-2">
              <label htmlFor={routingId} className="text-sm font-medium">
                Routing
              </label>
              <Input
                id={routingId}
                value={state.routing ?? ""}
                onChange={(e) => handleChange("routing", e.target.value)}
                placeholder="Custom routing value"
              />
            </div>

            {/* Preference */}
            <div className="space-y-2">
              <label htmlFor={preferenceId} className="text-sm font-medium">
                Preference
              </label>
              <Input
                id={preferenceId}
                value={state.preference ?? ""}
                onChange={(e) => handleChange("preference", e.target.value)}
                placeholder="_local, _primary, etc."
              />
            </div>

            {/* Realtime */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={realtimeId}
                checked={state.realtime ?? true}
                onCheckedChange={(checked) => handleChange("realtime", checked)}
              />
              <label htmlFor={realtimeId} className="text-sm font-medium">
                Realtime
              </label>
            </div>

            {/* Refresh */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={refreshId}
                checked={state.refresh ?? false}
                onCheckedChange={(checked) => handleChange("refresh", checked)}
              />
              <label htmlFor={refreshId} className="text-sm font-medium">
                Refresh before retrieve
              </label>
            </div>

            {/* Source Excludes */}
            <div className="space-y-2">
              <label htmlFor={sourceExcludesId} className="text-sm font-medium flex items-center gap-1.5">
                _source excludes
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Comma-separated list of fields to exclude from response</TooltipContent>
                </Tooltip>
              </label>
              <Input
                id={sourceExcludesId}
                value={state.sourceExcludes?.join(", ") ?? ""}
                onChange={(e) =>
                  handleChange(
                    "sourceExcludes",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="field1, field2"
              />
            </div>

            {/* Stored Fields */}
            <div className="space-y-2">
              <label htmlFor={storedFieldsId} className="text-sm font-medium flex items-center gap-1.5">
                Stored Fields
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Comma-separated list of stored fields to retrieve</TooltipContent>
                </Tooltip>
              </label>
              <Input
                id={storedFieldsId}
                value={state.storedFields?.join(", ") ?? ""}
                onChange={(e) =>
                  handleChange(
                    "storedFields",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="field1, field2"
              />
            </div>

            {/* Version */}
            <div className="space-y-2">
              <label htmlFor={versionId} className="text-sm font-medium">
                Version
              </label>
              <Input
                id={versionId}
                type="number"
                value={state.version ?? ""}
                onChange={(e) => handleChange("version", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Document version"
              />
            </div>
          </div>

          {/* Run Button */}
          <div className="w-fit">
            <Button
              size="icon"
              variant="destructive"
              onClick={onRun}
              disabled={isRunDisabled || isLoading || !state.documentId}
            >
              {isLoading ? <Spinner /> : <Play />}
            </Button>
          </div>
        </div>
      </Panel>

      {/* Fields panel */}
      {fields && (
        <>
          <PanelResizeHandle />
          <Panel className="w-full h-full">
            <Fields
              fields={fields}
              className="w-full h-full overflow-hidden"
              onSelectionChange={onFieldsSelectionChange}
            />
          </Panel>
        </>
      )}
    </PanelGroup>
  );
};
