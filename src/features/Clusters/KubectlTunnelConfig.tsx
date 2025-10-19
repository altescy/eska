import { Cloud, Network, Server } from "lucide-react";
import React from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { KubectlTunnel } from "@/types/cluster";

export interface KubectlTunnelConfigHandler {
  getTunnel: () => KubectlTunnel | undefined;
}

export interface KubectlTunnelConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  tunnel: KubectlTunnel;
}

export const KubectlTunnelConfig = React.forwardRef<KubectlTunnelConfigHandler, KubectlTunnelConfigProps>(
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
