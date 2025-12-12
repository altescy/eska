import { Play } from "lucide-react";
import { useEffect } from "react";
import { Panel } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { ElasticsearchInfoOperationState, InfoType } from "@/types/elasticsearch";

export interface InfoFormProps {
  state: Partial<ElasticsearchInfoOperationState>;
  isLoading?: boolean;
  isRunDisabled?: boolean;
  onStateChange: (state: Partial<ElasticsearchInfoOperationState>) => void;
  onRun: () => void;
}

export const InfoForm = ({ state, isLoading = false, isRunDisabled = false, onStateChange, onRun }: InfoFormProps) => {
  const handleChange = (field: keyof ElasticsearchInfoOperationState, value: unknown) => {
    onStateChange({ ...state, [field]: value });
  };

  // Cmd/Ctrl + Enter to run
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (!isRunDisabled && !isLoading) {
          onRun();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRun, isRunDisabled, isLoading]);

  return (
    <Panel className="w-full h-full flex-1">
      <div className="flex flex-row gap-4 h-full w-full">
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Information Type</div>
            <Select
              value={state.infoType ?? "mapping"}
              onValueChange={(value) => handleChange("infoType", value as InfoType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select information type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Type</SelectLabel>
                  <SelectItem value="mapping">Mapping</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="aliases">Aliases</SelectItem>
                  <SelectItem value="stats">Statistics</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="text-sm text-gray-600 space-y-2 pt-4">
            <p className="font-medium">Description:</p>
            {state.infoType === "mapping" && <p>View the field mappings and data types of the index.</p>}
            {state.infoType === "settings" && (
              <p>View the index settings including analyzers, number of shards, and replicas.</p>
            )}
            {state.infoType === "aliases" && <p>View the aliases associated with the index.</p>}
            {state.infoType === "stats" && (
              <p>View detailed statistics about the index including size, document count, and performance metrics.</p>
            )}
            {!state.infoType && <p>Select an information type to view details about the index.</p>}
          </div>
        </div>

        {/* Run Button */}
        <div className="w-fit">
          <Button size="icon" variant="destructive" onClick={onRun} disabled={isRunDisabled || isLoading}>
            {isLoading ? <Spinner /> : <Play />}
          </Button>
        </div>
      </div>
    </Panel>
  );
};
