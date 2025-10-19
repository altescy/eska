import { Lock, Tag, Terminal } from "lucide-react";
import React from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uuid4 } from "@/lib/uuid";
import type { AuthType, BasicAuth, Cluster, KubectlTunnel, NoAuth, SSHTunnel, TunnelType } from "@/types/cluster";
import { BasicAuthConfig, type BasicAuthConfigHandler } from "./BasicAuthConfig";
import { KubectlTunnelConfig, type KubectlTunnelConfigHandler } from "./KubectlTunnelConfig";
import { NoAuthConfig, type NoAuthConfigHandler } from "./NoAuthConfig";
import { NoneTunnelConfig, type NoneTunnelConfigHandler } from "./NoneTunnelConfig";
import { SSHTunnelConfig, type SSHTunnelConfigHandler } from "./SSHTunnelConfig";

export interface ClusterConfigHandler<T extends Cluster = Cluster> {
  getCluster: () => T | undefined;
}

export interface ClusterConfigProps<T extends Cluster = Cluster> extends React.HTMLAttributes<HTMLDivElement> {
  initialCluster?: T;
}

export const ClusterConfig = React.forwardRef(
  <T extends Cluster>({ initialCluster, ...props }: ClusterConfigProps<T>, ref: React.Ref<ClusterConfigHandler<T>>) => {
    const [clusterName, setClusterName] = React.useState(initialCluster?.name ?? "");
    const [tunnelType, setTunnelType] = React.useState<TunnelType>(initialCluster?.tunnel?.type ?? "none");
    const [authType, setAuthType] = React.useState<AuthType>(initialCluster?.auth.type ?? "noauth");
    const tunnelRef = React.useRef<NoneTunnelConfigHandler | KubectlTunnelConfigHandler | SSHTunnelConfigHandler>(null);
    const authRef = React.useRef<NoAuthConfigHandler | BasicAuthConfigHandler>(null);

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
              <NoAuthConfig
                ref={authType === "noauth" ? (authRef as React.Ref<NoAuthConfigHandler>) : undefined}
                auth={
                  initialCluster?.auth.type === "noauth"
                    ? (initialCluster.auth as NoAuth)
                    : { type: "noauth", host: "" }
                }
                tunnelType={tunnelType}
              />
            </TabsContent>
            <TabsContent value="basic">
              <BasicAuthConfig
                ref={authType === "basic" ? (authRef as React.Ref<BasicAuthConfigHandler>) : undefined}
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
