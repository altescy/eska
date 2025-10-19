import { Key, Lock, Server, User } from "lucide-react";
import React from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SSHTunnel } from "@/types/cluster";

export interface SSHTunnelConfigHandler {
  getTunnel: () => SSHTunnel | undefined;
}

export interface SSHTunnelConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  tunnel: SSHTunnel;
}

export const SSHTunnelConfig = React.forwardRef<SSHTunnelConfigHandler, SSHTunnelConfigProps>(
  ({ tunnel, ...props }, ref) => {
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
            <InputGroupInput
              type="text"
              placeholder="SSH Host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
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
  },
);
