import { useEffect, useState } from "react";
import type { PortForwardStatus, TunnelConfig } from "@/types/cluster";

export function usePortForward(clusterId: string, config: TunnelConfig) {
  const [status, setStatus] = useState<PortForwardStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (config.type === "none") {
      setStatus(null);
      return;
    }

    // Listen for status changes
    const unsubscribe = window.portForward.onStatusChange((newStatus) => {
      if (newStatus.clusterId === clusterId) {
        setStatus(newStatus);
        setIsConnecting(false);
      }
    });

    // Get initial status
    window.portForward.getStatus(clusterId).then((initialStatus) => {
      if (initialStatus) {
        setStatus(initialStatus);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [clusterId, config.type]);

  const start = async () => {
    if (config.type === "none") return;

    setIsConnecting(true);
    try {
      const localPort = await window.portForward.start(clusterId, config);
      return localPort;
    } catch (error) {
      console.error("Failed to start port forward:", error);
      setIsConnecting(false);
      throw error;
    }
  };

  const stop = async () => {
    await window.portForward.stop(clusterId);
  };

  return {
    status,
    isConnecting,
    start,
    stop,
    isConnected: status?.state === "connected",
    localPort: status?.localPort,
    error: status?.error,
  };
}
