export type AuthType = "noauth" | "basic" | "apikey" | "bearer";

export interface BaseAuthConfig<T extends AuthType> {
  type: T;
}

export interface NoAuth extends BaseAuthConfig<"noauth"> {
  host: string;
}

export interface BasicAuth extends BaseAuthConfig<"basic"> {
  host: string;
  username: string;
  password: string;
}

export interface ApiKeyAuth extends BaseAuthConfig<"apikey"> {
  host: string;
  id: string;
  apiKey: string;
}

export interface BearerAuth extends BaseAuthConfig<"bearer"> {
  host: string;
  token: string;
}

export type AuthConfig = NoAuth | BasicAuth | ApiKeyAuth | BearerAuth;

// Tunnel configurations
export type TunnelType = "none" | "kubectl" | "ssh";

export interface BaseTunnelConfig<T extends TunnelType> {
  type: T;
}

export interface NoneTunnel extends BaseTunnelConfig<"none"> {}

export interface KubectlTunnel extends BaseTunnelConfig<"kubectl"> {
  context: string;
  namespace: string;
  resource: string; // e.g., 'svc/acrux-es-http' or 'pod/es-master-0'
  remotePort: number;
  localPort?: number; // Auto-assigned if not specified
}

export interface SSHTunnel extends BaseTunnelConfig<"ssh"> {
  host: string;
  port: number; // SSH port (default: 22)
  username: string;
  authMethod: "password" | "key" | "agent";
  password?: string;
  keyPath?: string;
  remoteHost: string; // Elasticsearch host on remote (e.g., 'localhost')
  remotePort: number; // Elasticsearch port on remote (e.g., 9200)
  localPort?: number; // Auto-assigned if not specified
}

export type TunnelConfig = NoneTunnel | KubectlTunnel | SSHTunnel;

// Port forward status
export interface PortForwardStatus {
  clusterId: string;
  state: "connecting" | "connected" | "disconnected" | "error";
  localPort?: number;
  error?: string;
  pid?: number;
}

export interface BaseCluster<Auth extends AuthConfig> {
  id: string;
  name: string;
  auth: Auth;
  tunnel: TunnelConfig;
}

export type Cluster = BaseCluster<NoAuth> | BaseCluster<BasicAuth> | BaseCluster<ApiKeyAuth> | BaseCluster<BearerAuth>;
