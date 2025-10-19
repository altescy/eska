import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SettingItem } from "./SettingItem";

export const DataSettings = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Application Data</h3>
      <div className="space-y-3">
        <SettingItem
          label="Export Data"
          description="Export clusters, collections, and settings"
          control={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export application data</TooltipContent>
            </Tooltip>
          }
        />
        <SettingItem
          label="Import Data"
          description="Import data from a backup file"
          control={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import application data</TooltipContent>
            </Tooltip>
          }
        />
        <SettingItem
          label="Clear All Data"
          description="Remove all application data (cannot be undone)"
          control={
            <Button variant="destructive" size="sm" disabled>
              Clear
            </Button>
          }
        />
      </div>
    </div>
  );
};
