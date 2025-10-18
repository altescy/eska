export type AuthType = "noauth" | "basic";

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

export type AuthConfig = NoAuth | BasicAuth;

export interface BaseCluster<Auth extends BaseAuthConfig> {
  id: string;
  name: string;
  auth: Auth;
}

export type Cluster = BaseCluster<NoAuth> | BaseCluster<BasicAuth>;
