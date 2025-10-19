import React from "react";
import type { NoneTunnel } from "@/types/cluster";

export interface NoneTunnelConfigHandler {
  getTunnel: () => NoneTunnel | undefined;
}

export interface NoneTunnelConfigProps extends React.HTMLAttributes<HTMLDivElement> {
  tunnel: NoneTunnel;
}

export const NoneTunnelConfig = React.forwardRef<NoneTunnelConfigHandler, NoneTunnelConfigProps>(
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
