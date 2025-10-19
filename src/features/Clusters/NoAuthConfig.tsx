import { clsx } from "clsx";
import { Server } from "lucide-react";
import React from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { NoAuth, TunnelType } from "@/types/cluster";

export interface NoAuthConfigHandler {
  getAuth: () => NoAuth | undefined;
}

export interface NoAuthConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  auth: NoAuth;
  tunnelType: TunnelType;
}

export const NoAuthConfig = React.forwardRef<NoAuthConfigHandler, NoAuthConfigProps>(
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
