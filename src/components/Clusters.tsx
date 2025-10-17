import { useAtom } from "jotai";
import { Lock, Plus, Server, Tag, User } from "lucide-react";
import React from "react";
import { ElasticsearchConfigsAtom } from "@/atoms/esconfigs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ElasticsearchConfig } from "@/types/elasticsearch";

interface ClusterConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  initialConfig?: { name: string; config: ElasticsearchConfig };
}

interface ClusterConfigHandler {
  getConfig: () => { name: string; config: ElasticsearchConfig } | null;
}

const ClusterConfig = React.forwardRef<ClusterConfigHandler, ClusterConfigProps>(({ initialConfig, ...props }, ref) => {
  const [clusterName, setClusterName] = React.useState(initialConfig?.name ?? "");
  const [host, setHost] = React.useState(initialConfig?.config.host ?? "");
  const [authType, setAuthType] = React.useState<"basic" | null>(initialConfig?.config.auth?.type ?? null);
  const [username, setUsername] = React.useState(initialConfig?.config.auth?.username ?? "");
  const [password, setPassword] = React.useState(initialConfig?.config.auth?.password ?? "");

  React.useImperativeHandle(
    ref,
    () => ({
      getConfig: () => {
        if (!clusterName || !host) return null;
        const config: ElasticsearchConfig = {
          host,
          auth:
            authType === "basic"
              ? {
                  type: "basic",
                  username,
                  password,
                }
              : undefined,
        };
        return { name: clusterName, config };
      },
    }),
    [clusterName, host, authType, username, password],
  );

  return (
    <div {...props} className="grid gap-4 mt-4">
      <InputGroup>
        <InputGroupAddon>
          <Tag />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder="Cluster Name"
          value={clusterName}
          onChange={(e) => setClusterName(e.target.value)}
        />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <Server />
        </InputGroupAddon>
        <InputGroupInput type="text" placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} />
      </InputGroup>
      <Tabs
        value={authType ?? "no-auth"}
        onValueChange={(value) => {
          setAuthType(value === "no-auth" ? null : "basic");
        }}
      >
        <TabsList className="bg-[#90909020] backdrop-blur-3xl">
          <TabsTrigger value="no-auth" className="text-gray-800">
            No Auth
          </TabsTrigger>
          <TabsTrigger value="basic" className="text-gray-800">
            Basic Auth
          </TabsTrigger>
        </TabsList>
        <TabsContent value="no-auth">
          <Card className="bg-[#ffffff40] backdrop-blur-2xl border-none">
            <CardContent className="text-sm text-gray-700">
              No authentication will be used to connect to the cluster.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="basic">
          <Card className="bg-[#ffffff20] backdrop-blur-3xl border-none">
            <CardContent className="grid gap-2">
              <InputGroup>
                <InputGroupAddon>
                  <User />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>
                  <Lock />
                </InputGroupAddon>
                <InputGroupInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </InputGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export interface ClustersProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Clusters = ({ ...props }: ClustersProps) => {
  const [configs, setConfigs] = useAtom(ElasticsearchConfigsAtom);
  const [configToEdit, setConfigToEdit] = React.useState<{ name: string; config: ElasticsearchConfig }>();
  const [open, setOpen] = React.useState(false);
  const dialogRef = React.useRef<ClusterConfigHandler>(null);

  React.useEffect(() => {
    if (configToEdit) {
      setOpen(true);
    }
  }, [configToEdit]);

  React.useEffect(() => {
    if (open === false) {
      setConfigToEdit(undefined);
    }
  }, [open]);

  const handleSaveConfig = () => {
    const newConfig = dialogRef.current?.getConfig();
    if (newConfig) {
      setConfigs((prev) => ({
        ...prev,
        [newConfig.name]: newConfig.config,
      }));
    }
    setOpen(false);
  };

  return (
    <div {...props}>
      <div className="flex flex-col w-full h-full">
        <ul className="h-full max-h-full overflow-y-auto">
          {Object.entries(configs).map(([name, config]) => (
            //biome-ignore lint/a11y/useKeyWithClickEvents: Click to focus input
            <li key={name} className="p-2" onClick={() => setConfigToEdit({ name, config })}>
              <Card className="bg-[#ffffff50] backdrop-blur-xl p-3 gap-1 cursor-pointer">
                <CardTitle className="text-gray-800 font-medium">{name}</CardTitle>
                <CardDescription className="text-sm">{config.host}</CardDescription>
              </Card>
            </li>
          ))}
        </ul>
        <div className="flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild className="px-5 py-2 w-full">
            <Button variant="ghost" size="sm">
              <Plus />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[#ffffffa0] backdrop-blur-3xl backdrop-brightness-200">
            <DialogHeader>
              <DialogTitle>Add Cluster</DialogTitle>
              <DialogDescription>Add a new Elasticsearch cluster configuration.</DialogDescription>
            </DialogHeader>
            <ClusterConfig ref={dialogRef} initialConfig={configToEdit} />
            <DialogFooter>
              <Button type="submit" onClick={handleSaveConfig}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
