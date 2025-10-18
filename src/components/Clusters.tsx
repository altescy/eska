import { clsx } from "clsx";
import { useAtom } from "jotai";
import { Activity, Lock, Pen, Plus, Search, Server, Tag, Trash, User } from "lucide-react";
import React from "react";
import { clustersAtom } from "@/atoms/clusters";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useElasticsearch } from "@/hooks/useElasticsearch";
import { uuid4 } from "@/lib/uuid";
import type { AuthConfig, AuthType, BasicAuth, Cluster, NoAuth } from "@/types/cluster";
import type { ElasticsearchClusterHealthResponse } from "@/types/elasticsearch";

interface ClusterAuthConfigHandler<T extends AuthConfig> {
  getAuth: () => T | undefined;
}

interface ClusterNoAuthConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  auth: NoAuth;
}

interface ClusterNoAuthConfigHandler extends ClusterAuthConfigHandler<NoAuth> {}

const ClusterNoAuthConfig = React.forwardRef<ClusterNoAuthConfigHandler, ClusterNoAuthConfigProps>(
  ({ auth, ...props }, ref) => {
    const [host, setHost] = React.useState(auth.host);

    React.useImperativeHandle(
      ref,
      () => ({
        getAuth: () => ({
          type: "noauth",
          host,
        }),
      }),
      [host],
    );

    return (
      <div {...props} className="grid gap-4 mt-4">
        <InputGroup>
          <InputGroupAddon>
            <Server />
          </InputGroupAddon>
          <InputGroupInput type="text" placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} />
        </InputGroup>
      </div>
    );
  },
);

interface ClusterBasicAuthConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  auth: BasicAuth;
}

interface ClusterBasicAuthConfigHandler extends ClusterAuthConfigHandler<BasicAuth> {}

const ClusterBasicAuthConfig = React.forwardRef<ClusterBasicAuthConfigHandler, ClusterBasicAuthConfigProps>(
  ({ auth, ...props }, ref) => {
    const [host, setHost] = React.useState(auth.host);
    const [username, setUsername] = React.useState(auth.username);
    const [password, setPassword] = React.useState(auth.password);

    React.useImperativeHandle(
      ref,
      () => ({
        getAuth: () => ({
          type: "basic",
          host,
          username,
          password,
        }),
      }),
      [host, username, password],
    );

    return (
      <div {...props} className="grid gap-4 mt-4">
        <InputGroup>
          <InputGroupAddon>
            <Server />
          </InputGroupAddon>
          <InputGroupInput type="text" placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} />
        </InputGroup>
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

interface ClusterConfigProps<T extends Cluster> extends React.HTMLAttributes<HTMLDivElement> {
  initialCluster?: T;
}

interface ClusterConfigHandler<T extends Cluster> {
  getCluster: () => T | undefined;
}

const ClusterConfig = React.forwardRef(
  <T extends Cluster>({ initialCluster, ...props }: ClusterConfigProps<T>, ref: React.Ref<ClusterConfigHandler<T>>) => {
    const [clusterName, setClusterName] = React.useState(initialCluster?.name ?? "");
    const [authType, setAuthType] = React.useState<AuthType>(initialCluster?.auth.type ?? "noauth");
    const authRef = React.useRef<ClusterAuthConfigHandler<NoAuth> | ClusterAuthConfigHandler<BasicAuth>>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        getCluster: () => {
          if (!clusterName || !authRef.current) return undefined;
          const auth = authRef.current.getAuth();
          return {
            ...(initialCluster ?? { id: uuid4() }),
            name: clusterName,
            auth: auth,
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
        <Tabs value={authType} onValueChange={(value) => setAuthType(value as AuthType)}>
          <TabsList className="bg-gray-200/50 rounded-md">
            <TabsTrigger value="noauth">No Auth</TabsTrigger>
            <TabsTrigger value="basic">Basic Auth</TabsTrigger>
          </TabsList>
          <TabsContent value="noauth">
            <ClusterNoAuthConfig
              ref={authType === "noauth" ? (authRef as React.Ref<ClusterNoAuthConfigHandler>) : undefined}
              auth={
                initialCluster?.auth.type === "noauth" ? (initialCluster.auth as NoAuth) : { type: "noauth", host: "" }
              }
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
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);

export interface ClusterInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  cluster: Cluster;
}

export const ClusterInfo = ({ cluster, ...props }: ClusterInfoProps) => {
  const elasticsearch = useElasticsearch(cluster);
  const [health, setHealth] = React.useState<ElasticsearchClusterHealthResponse | Error>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: The elasticsearch.health function is stable.
  React.useEffect(() => {
    (async () => {
      try {
        setHealth(await elasticsearch.health());
      } catch (error) {
        setHealth(error as Error);
      }
    })();
  }, [elasticsearch.health]);

  return (
    <div {...props}>
      <fieldset className="border-2 border-gray-400/50 rounded-lg py-2 px-6 bg-white/10">
        <legend className="text-lg font-semibold px-2">
          <Activity className="inline-block mr-2" />
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
  const [clusters, setClusters] = useAtom(clustersAtom);
  const [selectedCluster, setSelectedCluster] = React.useState<Cluster>();
  const [open, setOpen] = React.useState(false);
  const dialogRef = React.useRef<ClusterConfigHandler<Cluster>>(null);

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
    setClusters((prev) => prev.filter((c) => c.id !== cluster.id));
    if (selectedCluster?.id === cluster.id) {
      setSelectedCluster(undefined);
    }
  };

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
          <div className="h-fit w-full shrink-0 flex gap-1">
            <InputGroup className="w-full flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Search clusters..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild className="px-5 py-2 w-fit shrink-0">
                <Button variant="ghost" size="sm" onClick={handleNewCluster}>
                  <Plus />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-[#ffffffa0] backdrop-blur-3xl backdrop-brightness-200">
                <DialogHeader>
                  <DialogTitle>Add Cluster</DialogTitle>
                  <DialogDescription>Add a new Elasticsearch cluster configuration.</DialogDescription>
                </DialogHeader>
                <ClusterConfig ref={dialogRef} initialCluster={selectedCluster} />
                <DialogFooter>
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
                <h5 className="text-gray-800 font-medium">{cluster.name}</h5>
                <p className="text-sm text-gray-500">{cluster.auth.host}</p>
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
                  <Button variant="ghost" size="icon" onClick={() => handleEditCluster(selectedCluster)}>
                    <Pen />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCluster(selectedCluster)}>
                    <Trash className="mr-2" />
                  </Button>
                </div>
              </div>
              <ClusterInfo cluster={selectedCluster} />
            </div>
          ) : (
            <div className="text-gray-400">Select a cluster to view its configuration.</div>
          )}
        </div>
      </div>
    </div>
  );
};
