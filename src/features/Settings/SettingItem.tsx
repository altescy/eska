import type React from "react";

export interface SettingItemProps {
  label: string;
  description: string;
  control: React.ReactNode;
}

export const SettingItem = ({ label, description, control }: SettingItemProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      {control}
    </div>
  );
};
