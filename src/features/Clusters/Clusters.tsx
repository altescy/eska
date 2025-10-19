import { clsx } from "clsx";
import {
  Activity,
  Cloud,
  Key,
  Lock,
  Network,
  Pen,
  Plus,
  Search,
  Server,
  Tag,
  Terminal,
  Trash,
  User,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClusters } from "@/hooks/useClusters";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import { uuid4 } from "@/lib/uuid";
import type {
  AuthConfig,
  AuthType,
  BasicAuth,
  Cluster,
  KubectlTunnel,
  NoAuth,
  NoneTunnel,
  SSHTunnel,
  TunnelConfig,
  TunnelType,
} from "@/types/cluster";
import type { ElasticsearchClusterHealthResponse } from "@/types/elasticsearch";

interface ClusterAuthConfigHandler<T extends AuthConfig> {
  getAuth: () => T | undefined;
}

interface ClusterNoAuthConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  auth: NoAuth;
  tunnelType: TunnelType;
}

interface ClusterNoAuthConfigHandler extends ClusterAuthConfigHandler<NoAuth> {}

const ClusterNoAuthConfig = React.forwardRef<ClusterNoAuthConfigHandler, ClusterNoAuthConfigProps>(
  ({ auth, tunnelType, ...props }, ref) => {
    const [host, setHost] = React.useState(auth.host);
    const isPortForwarding = tunnelType !== "none";

    React.useImperativeHandle(
      ref,
      () => ({
        getAuth: () => ({
          type: "noauth",
          host: isPortForwarding ? "http://localhost" : host,
        }),
      }),
      [host, isPortForwarding],
    );

    return (
      <div {...props} className="mt-2">
        <InputGroup>
          <InputGroupAddon>
            <Server />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder={isPortForwarding ? "Host (managed by port forwarding)" : "Host (e.g., http://localhost:9200)"}
            value={isPortForwarding ? "http://localhost (via port forwarding)" : host}
            onChange={(e) => setHost(e.target.value)}
            disabled={isPortForwarding}
            className={clsx(isPortForwarding && "text-gray-500 cursor-not-allowed")}
          />
        </InputGroup>
        {isPortForwarding && (
          <p className="text-xs text-gray-500 mt-1 ml-2">
            Host is automatically set to localhost when using port forwarding
          </p>
        )}
      </div>
    );
  },
);

interface ClusterBasicAuthConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  auth: BasicAuth;
  tunnelType: TunnelType;
}

interface ClusterBasicAuthConfigHandler extends ClusterAuthConfigHandler<BasicAuth> {}

const ClusterBasicAuthConfig = React.forwardRef<ClusterBasicAuthConfigHandler, ClusterBasicAuthConfigProps>(
  ({ auth, tunnelType, ...props }, ref) => {
    const [host, setHost] = React.useState(auth.host);
    const [username, setUsername] = React.useState(auth.username);
    const [password, setPassword] = React.useState(auth.password);
    const isPortForwarding = tunnelType !== "none";

    React.useImperativeHandle(
      ref,
      () => ({
        getAuth: () => ({
          type: "basic",
          host: isPortForwarding ? "http://localhost" : host,
          username,
          password,
        }),
      }),
      [host, username, password, isPortForwarding],
    );

    return (
      <div {...props} className="grid gap-4 mt-4">
        <div>
          <InputGroup>
            <InputGroupAddon>
              <Server />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder={
                isPortForwarding ? "Host (managed by port forwarding)" : "Host (e.g., http://localhost:9200)"
              }
              value={isPortForwarding ? "http://localhost (via port forwarding)" : host}
              onChange={(e) => setHost(e.target.value)}
              disabled={isPortForwarding}
              className={clsx(isPortForwarding && "text-gray-500 cursor-not-allowed")}
            />
          </InputGroup>
          {isPortForwarding && (
            <p className="text-xs text-gray-500 mt-1 ml-2">
              Host is automatically set to localhost when using port forwarding
            </p>
          )}
        </div>
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
      </div>
    );
  },
);

// Tunnel Configuration Components
interface TunnelConfigHandler<T extends TunnelConfig> {
  getTunnel: () => T | undefined;
}

interface NoneTunnelConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  tunnel: NoneTunnel;
}

interface NoneTunnelConfigHandler extends TunnelConfigHandler<NoneTunnel> {}

const NoneTunnelConfig = React.forwardRef<NoneTunnelConfigHandler, NoneTunnelConfigProps>(
  ({ tunnel, ...props }, ref) => {
    React.useImperativeHandle(
      ref,
      () => ({
        getTunnel: () => ({ type: "none" }),
      }),
      [],
    );

    return (
      <div {...props} className="grid gap-4 mt-4">
        <p className="text-sm text-gray-600">Direct connection to Elasticsearch cluster (no port forwarding)</p>
      </div>
    );
  },
);

interface KubectlTunnelConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  tunnel: KubectlTunnel;
}

interface KubectlTunnelConfigHandler extends TunnelConfigHandler<KubectlTunnel> {}

const KubectlTunnelConfig = React.forwardRef<KubectlTunnelConfigHandler, KubectlTunnelConfigProps>(
  ({ tunnel, ...props }, ref) => {
    const [context, setContext] = React.useState(tunnel.context);
    const [namespace, setNamespace] = React.useState(tunnel.namespace);
    const [resource, setResource] = React.useState(tunnel.resource);
    const [remotePort, setRemotePort] = React.useState(String(tunnel.remotePort));
    const [localPort, setLocalPort] = React.useState(tunnel.localPort ? String(tunnel.localPort) : "");

    React.useImperativeHandle(
      ref,
      () => ({
        getTunnel: () => ({
          type: "kubectl",
          context,
          namespace,
          resource,
          remotePort: Number(remotePort),
          localPort: localPort ? Number(localPort) : undefined,
        }),
      }),
      [context, namespace, resource, remotePort, localPort],
    );

    return (
      <div {...props} className="grid gap-4 mt-4">
        <InputGroup>
          <InputGroupAddon>
            <Cloud />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Context (e.g., my-k8s-context)"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon>
            <Network />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Namespace (e.g., elasticsearch)"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
          />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon>
            <Server />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Resource (e.g., svc/elasticsearch)"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          />
        </InputGroup>
        <div className="grid grid-cols-2 gap-4">
          <InputGroup>
            <InputGroupInput
              type="number"
              placeholder="Remote Port (e.g., 9200)"
              value={remotePort}
              onChange={(e) => setRemotePort(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <InputGroupInput
              type="number"
              placeholder="Local Port (auto)"
              value={localPort}
              onChange={(e) => setLocalPort(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>
    );
  },
);

interface SSHTunnelConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  tunnel: SSHTunnel;
}

interface SSHTunnelConfigHandler extends TunnelConfigHandler<SSHTunnel> {}

const SSHTunnelConfig = React.forwardRef<SSHTunnelConfigHandler, SSHTunnelConfigProps>(({ tunnel, ...props }, ref) => {
  const [host, setHost] = React.useState(tunnel.host);
  const [port, setPort] = React.useState(String(tunnel.port));
  const [username, setUsername] = React.useState(tunnel.username);
  const [authMethod, setAuthMethod] = React.useState<"key" | "agent" | "password">(tunnel.authMethod);
  const [keyPath, setKeyPath] = React.useState(tunnel.keyPath ?? "");
  const [password, setPassword] = React.useState(tunnel.password ?? "");
  const [remoteHost, setRemoteHost] = React.useState(tunnel.remoteHost);
  const [remotePort, setRemotePort] = React.useState(String(tunnel.remotePort));
  const [localPort, setLocalPort] = React.useState(tunnel.localPort ? String(tunnel.localPort) : "");

  React.useImperativeHandle(
    ref,
    () => ({
      getTunnel: () => ({
        type: "ssh",
        host,
        port: Number(port),
        username,
        authMethod,
        keyPath: authMethod === "key" ? keyPath : undefined,
        password: authMethod === "password" ? password : undefined,
        remoteHost,
        remotePort: Number(remotePort),
        localPort: localPort ? Number(localPort) : undefined,
      }),
    }),
    [host, port, username, authMethod, keyPath, password, remoteHost, remotePort, localPort],
  );

  return (
    <div {...props} className="grid gap-4 mt-4">
      <div className="grid grid-cols-3 gap-4">
        <InputGroup className="col-span-2">
          <InputGroupAddon>
            <Server />
          </InputGroupAddon>
          <InputGroupInput type="text" placeholder="SSH Host" value={host} onChange={(e) => setHost(e.target.value)} />
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            type="number"
            placeholder="Port (22)"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </InputGroup>
      </div>
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
      <Select value={authMethod} onValueChange={(value) => setAuthMethod(value as "key" | "agent" | "password")}>
        <SelectTrigger>
          <SelectValue placeholder="Auth Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="key">SSH Key</SelectItem>
          <SelectItem value="agent">SSH Agent</SelectItem>
          <SelectItem value="password">Password (requires sshpass)</SelectItem>
        </SelectContent>
      </Select>
      {authMethod === "key" && (
        <InputGroup>
          <InputGroupAddon>
            <Key />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Path to SSH Key (e.g., ~/.ssh/id_rsa)"
            value={keyPath}
            onChange={(e) => setKeyPath(e.target.value)}
          />
        </InputGroup>
      )}
      {authMethod === "password" && (
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
      )}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Remote Elasticsearch Location</p>
        <div className="grid grid-cols-2 gap-4">
          <InputGroup>
            <InputGroupInput
              type="text"
              placeholder="Remote Host (localhost)"
              value={remoteHost}
              onChange={(e) => setRemoteHost(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <InputGroupInput
              type="number"
              placeholder="Remote Port (9200)"
              value={remotePort}
              onChange={(e) => setRemotePort(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>
      <InputGroup>
        <InputGroupInput
          type="number"
          placeholder="Local Port (auto)"
          value={localPort}
          onChange={(e) => setLocalPort(e.target.value)}
        />
      </InputGroup>
    </div>
  );
});

interface ClusterConfigProps<T extends Cluster> extends React.HTMLAttributes<HTMLDivElement> {
  initialCluster?: T;
}

interface ClusterConfigHandler<T extends Cluster> {
  getCluster: () => T | undefined;
}

const ClusterConfig = React.forwardRef(
  <T extends Cluster>({ initialCluster, ...props }: ClusterConfigProps<T>, ref: React.Ref<ClusterConfigHandler<T>>) => {
    const [clusterName, setClusterName] = React.useState(initialCluster?.name ?? "");
    const [tunnelType, setTunnelType] = React.useState<TunnelType>(initialCluster?.tunnel?.type ?? "none");
    const [authType, setAuthType] = React.useState<AuthType>(initialCluster?.auth.type ?? "noauth");
    const tunnelRef = React.useRef<
      TunnelConfigHandler<NoneTunnel> | TunnelConfigHandler<KubectlTunnel> | TunnelConfigHandler<SSHTunnel>
    >(null);
    const authRef = React.useRef<ClusterAuthConfigHandler<NoAuth> | ClusterAuthConfigHandler<BasicAuth>>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        getCluster: () => {
          if (!clusterName || !authRef.current || !tunnelRef.current) return undefined;
          const auth = authRef.current.getAuth();
          const tunnel = tunnelRef.current.getTunnel();
          return {
            ...(initialCluster ?? { id: uuid4() }),
            name: clusterName,
            auth: auth,
            tunnel: tunnel,
          } as T;
        },
      }),
      [clusterName, initialCluster],
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

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Lock className="size-4" />
            Elasticsearch Authentication
          </h4>
          <Tabs value={authType} onValueChange={(value) => setAuthType(value as AuthType)}>
            <TabsList className="bg-gray-200/50 rounded-md">
              <TabsTrigger value="noauth">No Auth</TabsTrigger>
              <TabsTrigger value="basic">Basic Auth</TabsTrigger>
            </TabsList>
            <TabsContent value="noauth">
              <ClusterNoAuthConfig
                ref={authType === "noauth" ? (authRef as React.Ref<ClusterNoAuthConfigHandler>) : undefined}
                auth={
                  initialCluster?.auth.type === "noauth"
                    ? (initialCluster.auth as NoAuth)
                    : { type: "noauth", host: "" }
                }
                tunnelType={tunnelType}
              />
            </TabsContent>
            <TabsContent value="basic">
              <ClusterBasicAuthConfig
                ref={authType === "basic" ? (authRef as React.Ref<ClusterBasicAuthConfigHandler>) : undefined}
                auth={
                  initialCluster?.auth.type === "basic"
                    ? (initialCluster.auth as BasicAuth)
                    : { type: "basic", host: "", username: "", password: "" }
                }
                tunnelType={tunnelType}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Terminal className="size-4" />
            Port Forwarding
          </h4>
          <Select value={tunnelType} onValueChange={(value) => setTunnelType(value as TunnelType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select tunnel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Direct Connection)</SelectItem>
              <SelectItem value="ssh">SSH Tunnel</SelectItem>
              <SelectItem value="kubectl">Kubernetes (kubectl port-forward)</SelectItem>
            </SelectContent>
          </Select>
          {tunnelType === "none" && (
            <NoneTunnelConfig
              ref={tunnelType === "none" ? (tunnelRef as React.Ref<NoneTunnelConfigHandler>) : undefined}
              tunnel={{ type: "none" }}
            />
          )}
          {tunnelType === "kubectl" && (
            <KubectlTunnelConfig
              ref={tunnelType === "kubectl" ? (tunnelRef as React.Ref<KubectlTunnelConfigHandler>) : undefined}
              tunnel={
                initialCluster?.tunnel?.type === "kubectl"
                  ? (initialCluster.tunnel as KubectlTunnel)
                  : { type: "kubectl", context: "", namespace: "", resource: "", remotePort: 9200 }
              }
            />
          )}
          {tunnelType === "ssh" && (
            <SSHTunnelConfig
              ref={tunnelType === "ssh" ? (tunnelRef as React.Ref<SSHTunnelConfigHandler>) : undefined}
              tunnel={
                initialCluster?.tunnel?.type === "ssh"
                  ? (initialCluster.tunnel as SSHTunnel)
                  : {
                      type: "ssh",
                      host: "",
                      port: 22,
                      username: "",
                      authMethod: "key",
                      remoteHost: "localhost",
                      remotePort: 9200,
                    }
              }
            />
          )}
        </div>
      </div>
    );
  },
);

export interface ClusterInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  cluster: Cluster;
}

export const ClusterInfo = ({ cluster, ...props }: ClusterInfoProps) => {
  const elasticsearch = useElasticsearch();
  const [health, setHealth] = React.useState<ElasticsearchClusterHealthResponse | Error>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: No need to include elasticsearch.
  React.useEffect(() => {
    (async () => {
      try {
        setHealth(await elasticsearch.health(cluster));
      } catch (error) {
        setHealth(error as Error);
      }
    })();
  }, [elasticsearch.health]);

  return (
    <div {...props}>
      <fieldset className="border-2 border-gray-400/50 rounded-lg py-2 px-6 bg-white/10">
        <legend className="text-lg font-semibold px-4">
          <Activity className="inline-block mr-3" />
          Cluster Health
        </legend>
        {elasticsearch.isLoading ? (
          <Spinner className="m-auto size-5" />
        ) : health ? (
          health instanceof Error ? (
            <p className="text-red-500">Error: {health.message}</p>
          ) : (
            <table className="w-full px-2">
              <tbody>
                {Object.entries(health).map(([key, value]) => (
                  <tr key={key} className="m-2">
                    <td className="font-medium ml-2">{key}</td>
                    <td className="text-right mr-2">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <p>Loading...</p>
        )}
      </fieldset>
    </div>
  );
};

export interface ClustersProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Clusters = ({ ...props }: ClustersProps) => {
  const [query, setQuery] = React.useState("");
  const [clusters, setClusters] = useClusters();
  const [selectedCluster, setSelectedCluster] = React.useState<Cluster>();
  const [open, setOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [clusterToDelete, setClusterToDelete] = React.useState<Cluster>();
  const [isTestingConnection, setIsTestingConnection] = React.useState(false);
  const [connectionTestResult, setConnectionTestResult] = React.useState<"success" | "error" | null>(null);
  const dialogRef = React.useRef<ClusterConfigHandler<Cluster>>(null);
  const elasticsearch = useElasticsearch();

  const handleNewCluster = () => {
    setSelectedCluster(undefined);
    setOpen(true);
  };

  const handleSaveConfig = () => {
    const newCluster = dialogRef.current?.getCluster();
    if (newCluster) {
      setClusters((prev) => [...prev.filter((c) => c.id !== newCluster.id), newCluster]);
      setSelectedCluster(newCluster);
    }
    setOpen(false);
  };

  const handleEditCluster = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setOpen(true);
  };

  const handleDeleteCluster = (cluster: Cluster) => {
    setClusterToDelete(cluster);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clusterToDelete) {
      setClusters((prev) => prev.filter((c) => c.id !== clusterToDelete.id));
      if (selectedCluster?.id === clusterToDelete.id) {
        setSelectedCluster(undefined);
      }
    }
    setDeleteDialogOpen(false);
    setClusterToDelete(undefined);
  };

  const handleTestConnection = React.useCallback(async () => {
    const cluster = dialogRef.current?.getCluster();
    if (!cluster) return;

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      await elasticsearch.health(cluster);
      setConnectionTestResult("success");
    } catch (error) {
      setConnectionTestResult("error");
      console.error("Connection test failed:", error);
    } finally {
      setIsTestingConnection(false);
    }
  }, [elasticsearch]);

  React.useEffect(() => {
    if (!open) {
      setConnectionTestResult(null);
    }
  }, [open]);

  const filteredClusters = React.useMemo(() => {
    if (!query) return clusters;
    return clusters
      .filter(
        (cluster) =>
          cluster.name.toLowerCase().includes(query.toLowerCase()) ||
          cluster.auth.host.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clusters, query]);

  return (
    <div {...props}>
      <div className="flex w-full h-full divide-x divide-gray-300/50">
        <div className="w-full max-w-[250px] flex-1 flex flex-col px-2">
          <div className="h-fit w-full shrink-0 flex gap-1 pt-1 items-center">
            <InputGroup className="w-full flex-1 border-none outline-none ">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Search clusters..."
                className="border-none outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
            <Dialog open={open} onOpenChange={setOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild className="px-5 py-2 w-fit shrink-0">
                    <Button variant="ghost" size="sm" onClick={handleNewCluster}>
                      <Plus />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Add cluster</TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-lg max-h-[90vh] flex flex-col bg-white/65 backdrop-blur-3xl backdrop-brightness-150">
                <DialogHeader>
                  <DialogTitle>Add Cluster</DialogTitle>
                  <DialogDescription>Add a new Elasticsearch cluster configuration.</DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[calc(90vh-12rem)] pr-2">
                  <ClusterConfig ref={dialogRef} initialCluster={selectedCluster} />
                </div>
                {connectionTestResult && (
                  <div
                    className={clsx(
                      "text-sm px-4 py-2 rounded-md",
                      connectionTestResult === "success" && "bg-green-100 text-green-800",
                      connectionTestResult === "error" && "bg-red-100 text-red-800",
                    )}
                  >
                    {connectionTestResult === "success"
                      ? "Connection successful!"
                      : "Connection failed. Please check your configuration."}
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                      >
                        {isTestingConnection ? <Spinner className="mr-2" /> : null}
                        Test Connection
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Test connection to cluster</TooltipContent>
                  </Tooltip>
                  <Button type="submit" onClick={handleSaveConfig}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <ul className="h-full max-h-full overflow-y-auto flex-1 divide-y divide-gray-300/50 mt-2">
            {filteredClusters.map((cluster) => (
              //biome-ignore lint/a11y/useKeyWithClickEvents: Click to focus input
              <li
                key={cluster.id}
                className={clsx(
                  "h-[4rem] p-2 cursor-pointer hover:bg-gray-100/50 rounded-lg",
                  cluster.id === selectedCluster?.id && "bg-white/50",
                )}
                onClick={() => setSelectedCluster(cluster)}
              >
                <h5 className="text-gray-800 font-medium truncate">{cluster.name}</h5>
                <p className="text-sm text-gray-500 truncate">{cluster.auth.host}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 flex-1 w-full h-full ml-2 text-gray-800">
          {selectedCluster ? (
            <div className="overflow-y-auto h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold">{selectedCluster.name}</h3>
                <div className="grid gap-1 grid-flow-col">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleEditCluster(selectedCluster)}>
                        <Pen />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit cluster</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCluster(selectedCluster)}>
                        <Trash />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete cluster</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <ClusterInfo cluster={selectedCluster} />
            </div>
          ) : (
            <div className="text-gray-400">Select a cluster to view its configuration.</div>
          )}
        </div>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-[#ffffffa0] backdrop-blur-3xl backdrop-brightness-200">
          <DialogHeader>
            <DialogTitle>Delete Cluster</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the cluster "{clusterToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
