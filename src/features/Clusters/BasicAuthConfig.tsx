import { clsx } from "clsx";
import { Lock, Server, User } from "lucide-react";
import React from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { BasicAuth, TunnelType } from "@/types/cluster";

export interface BasicAuthConfigHandler {
  getAuth: () => BasicAuth | undefined;
}

export interface BasicAuthConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  auth: BasicAuth;
  tunnelType: TunnelType;
}

export const BasicAuthConfig = React.forwardRef<BasicAuthConfigHandler, BasicAuthConfigProps>(
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
