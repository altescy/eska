import { Check, Clipboard, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface QueryActionsProps {
  onRun: () => void;
  onFormat: () => void;
  onCopy: () => void;
  isLoading?: boolean;
  isRunDisabled?: boolean;
  isCopied?: boolean;
}

export const QueryActions = ({
  onRun,
  onFormat,
  onCopy,
  isLoading = false,
  isRunDisabled = false,
  isCopied = false,
}: QueryActionsProps) => {
  return (
    <div className="w-fit h-full shrink-0 flex flex-col gap-2 items-center text-gray-700">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="destructive" size="icon" onClick={onRun} disabled={isRunDisabled || isLoading}>
            {isLoading ? <Spinner /> : <Play />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Run query</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onFormat}>
            <Sparkles />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Format query</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onCopy}>
            {isCopied ? <Check /> : <Clipboard />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isCopied ? "Copied" : "Copy query"}</TooltipContent>
      </Tooltip>
    </div>
  );
};
