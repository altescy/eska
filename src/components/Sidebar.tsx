import { Folder, History, Server, Settings } from "lucide-react";
import React from "react";
import { Clusters } from "@/components/Clusters";
import { Button } from "@/components/ui/button";

interface SidebarContent {
  readonly type: "content";
  readonly key: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly content: React.ReactNode;
}

interface SidebarSpacer {
  type: "spacer";
  key: string;
}

const SIDEBAR_CONTENTS: (SidebarContent | SidebarSpacer)[] = [
  {
    type: "content",
    key: "clusters",
    label: "Clusters",
    icon: <Server />,
    content: <Clusters className="min-w-40" />,
  },
  {
    type: "content",
    key: "collections",
    label: "Collections",
    icon: <Folder />,
    content: <div>Collections</div>,
  },
  {
    type: "content",
    key: "history",
    label: "History",
    icon: <History />,
    content: <div>History</div>,
  },
  {
    type: "spacer",
    key: "spacer",
  },
  {
    type: "content",
    key: "settings",
    label: "Settings",
    icon: <Settings />,
    content: <div>Settings</div>,
  },
];

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Sidebar = ({ ...props }: SidebarProps) => {
  const [content, setContent] = React.useState<SidebarContent>();

  const handleSelectContent = React.useCallback(
    (content: SidebarContent) => setContent((prev) => (prev?.key === content.key ? undefined : content)),
    [],
  );

  return (
    <div {...props}>
      <div className="w-full h-full flex">
        <div className="w-fit h-full shrink-0 flex flex-col gap-2">
          {SIDEBAR_CONTENTS.map((item) =>
            item.type === "spacer" ? (
              <div key={item.key} className="flex-1" />
            ) : (
              <Button
                key={item.key}
                variant={content?.key === item.key ? "secondary" : "ghost"}
                size="icon-lg"
                className="shrink-0"
                autoFocus
                onClick={() => handleSelectContent(item)}
              >
                {item.icon}
              </Button>
            ),
          )}
        </div>
        <div className="flex-1 h-full w-full ml-2">
          {SIDEBAR_CONTENTS.filter((item) => item.type !== "spacer").map((item) => (
            <div key={item.key} className="w-full h-full" hidden={content?.key !== item.key}>
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
