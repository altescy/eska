import { Info, Play } from "lucide-react";
import { useEffect, useId } from "react";
import { Panel } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ElasticsearchAnalyzeOperationState } from "@/types/elasticsearch";

export interface AnalyzeFormProps {
  state: Partial<ElasticsearchAnalyzeOperationState>;
  analyzers?: string[];
  fields?: string[];
  isLoading?: boolean;
  isRunDisabled?: boolean;
  onStateChange: (state: Partial<ElasticsearchAnalyzeOperationState>) => void;
  onRun: () => void;
}

export const AnalyzeForm = ({
  state,
  analyzers,
  fields,
  isLoading = false,
  isRunDisabled = false,
  onStateChange,
  onRun,
}: AnalyzeFormProps) => {
  const textId = useId();
  const analyzerId = useId();
  const fieldId = useId();
  const tokenizerId = useId();
  const filterId = useId();
  const charFilterId = useId();
  const explainId = useId();
  const attributesId = useId();

  const handleChange = (field: keyof ElasticsearchAnalyzeOperationState, value: unknown) => {
    onStateChange({ ...state, [field]: value });
  };

  // Cmd/Ctrl + Enter to run
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (!isRunDisabled && !isLoading && state.text) {
          onRun();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRun, isRunDisabled, isLoading, state.text]);

  return (
    <Panel className="w-full h-full flex-1">
      <div className="flex flex-row gap-4 h-full w-full">
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Text to analyze */}
          <div className="space-y-2">
            <label htmlFor={textId} className="text-sm font-medium">
              Text to Analyze *
            </label>
            <Textarea
              id={textId}
              value={state.text ?? ""}
              onChange={(e) => handleChange("text", e.target.value)}
              placeholder="Enter text to analyze"
              rows={4}
            />
          </div>

          {/* Analyzer */}
          <div className="space-y-2">
            <label htmlFor={analyzerId} className="text-sm font-medium">
              Analyzer
            </label>
            {analyzers && analyzers.length > 0 ? (
              <Combobox
                initialKey={state.analyzer}
                items={analyzers.map((analyzer) => ({
                  key: analyzer,
                  value: analyzer,
                  label: analyzer,
                }))}
                placeholder="Select analyzer"
                onSelectItem={(selected) => handleChange("analyzer", selected?.value ?? "")}
                className="w-full"
              />
            ) : (
              <Input
                id={analyzerId}
                value={state.analyzer ?? ""}
                onChange={(e) => handleChange("analyzer", e.target.value)}
                placeholder="standard, keyword, whitespace, etc."
              />
            )}
          </div>

          {/* Field (index-specific analyzer) */}
          <div className="space-y-2">
            <label htmlFor={fieldId} className="text-sm font-medium flex items-center gap-1.5">
              Field
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Use the analyzer configured for this field</TooltipContent>
              </Tooltip>
            </label>
            {fields && fields.length > 0 ? (
              <Combobox
                initialKey={state.field}
                items={fields.map((field) => ({
                  key: field,
                  value: field,
                  label: field,
                }))}
                placeholder="Select field"
                onSelectItem={(selected) => handleChange("field", selected?.value ?? "")}
                className="w-full"
              />
            ) : (
              <Input
                id={fieldId}
                value={state.field ?? ""}
                onChange={(e) => handleChange("field", e.target.value)}
                placeholder="Field name"
              />
            )}
          </div>

          {/* Tokenizer */}
          <div className="space-y-2">
            <label htmlFor={tokenizerId} className="text-sm font-medium">
              Tokenizer
            </label>
            <Input
              id={tokenizerId}
              value={state.tokenizer ?? ""}
              onChange={(e) => handleChange("tokenizer", e.target.value)}
              placeholder="Custom tokenizer"
            />
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <label htmlFor={filterId} className="text-sm font-medium flex items-center gap-1.5">
              Token Filters
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Comma-separated list of token filters</TooltipContent>
              </Tooltip>
            </label>
            <Input
              id={filterId}
              value={state.filter?.join(", ") ?? ""}
              onChange={(e) =>
                handleChange(
                  "filter",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="lowercase, stop, snowball"
            />
          </div>

          {/* Char Filter */}
          <div className="space-y-2">
            <label htmlFor={charFilterId} className="text-sm font-medium flex items-center gap-1.5">
              Character Filters
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Comma-separated list of character filters</TooltipContent>
              </Tooltip>
            </label>
            <Input
              id={charFilterId}
              value={state.charFilter?.join(", ") ?? ""}
              onChange={(e) =>
                handleChange(
                  "charFilter",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="html_strip, mapping"
            />
          </div>

          {/* Attributes */}
          <div className="space-y-2">
            <label htmlFor={attributesId} className="text-sm font-medium flex items-center gap-1.5">
              Attributes
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Comma-separated list of token attributes to return</TooltipContent>
              </Tooltip>
            </label>
            <Input
              id={attributesId}
              value={state.attributes?.join(", ") ?? ""}
              onChange={(e) =>
                handleChange(
                  "attributes",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="keyword, type"
            />
          </div>

          {/* Explain */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id={explainId}
              checked={state.explain ?? false}
              onCheckedChange={(checked) => handleChange("explain", checked)}
            />
            <label htmlFor={explainId} className="text-sm font-medium flex items-center gap-1.5">
              Explain
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Include detailed token information</TooltipContent>
              </Tooltip>
            </label>
          </div>
        </div>

        {/* Run Button */}
        <div className="w-fit">
          <Button
            size="icon"
            variant="destructive"
            onClick={onRun}
            disabled={isRunDisabled || isLoading || !state.text}
          >
            {isLoading ? <Spinner /> : <Play />}
          </Button>
        </div>
      </div>
    </Panel>
  );
};
