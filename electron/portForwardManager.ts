import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import net from "node:net";

interface KubectlTunnelConfig {
  type: "kubectl";
  context: string;
  namespace: string;
  resource: string;
  remotePort: number;
  localPort?: number;
}

interface SSHTunnelConfig {
  type: "ssh";
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "key" | "agent";
  password?: string;
  keyPath?: string;
  remoteHost: string;
  remotePort: number;
  localPort?: number;
}

interface NoneTunnelConfig {
  type: "none";
}

type TunnelConfig = NoneTunnelConfig | KubectlTunnelConfig | SSHTunnelConfig;

export interface PortForwardStatus {
  clusterId: string;
  state: "connecting" | "connected" | "disconnected" | "error";
  localPort?: number;
  error?: string;
  pid?: number;
}

interface ForwardInfo {
  process: ChildProcess;
  config: KubectlTunnelConfig | SSHTunnelConfig;
  status: PortForwardStatus;
}

/**
 * Get an available port
 */
async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address !== "string") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Failed to get port"));
      }
    });
  });
}

export class PortForwardManager extends EventEmitter {
  private forwards: Map<string, ForwardInfo> = new Map();

  async start(clusterId: string, config: TunnelConfig): Promise<number | null> {
    if (config.type === "none") {
      return null;
    }

    // Stop existing forward if any
    await this.stop(clusterId);

    // Assign local port
    const localPort = config.localPort || (await getAvailablePort());

    this.emit("status", {
      clusterId,
      state: "connecting",
      localPort,
    } as PortForwardStatus);

    try {
      if (config.type === "kubectl") {
        return await this.startKubectl(clusterId, { ...config, localPort });
      }
      if (config.type === "ssh") {
        return await this.startSSH(clusterId, { ...config, localPort });
      }
      throw new Error(`Unknown tunnel type: ${(config as any).type}`);
    } catch (error) {
      this.emit("status", {
        clusterId,
        state: "error",
        error: error instanceof Error ? error.message : String(error),
      } as PortForwardStatus);
      throw error;
    }
  }

  private async startKubectl(
    clusterId: string,
    config: KubectlTunnelConfig & { localPort: number },
  ): Promise<number> {
    const args = [
      "port-forward",
      "--address=localhost",
      config.resource,
      `${config.localPort}:${config.remotePort}`,
      "--context",
      config.context,
      "-n",
      config.namespace,
    ];

    const proc = spawn("kubectl", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    return this.handleProcess(clusterId, proc, config);
  }

  private async startSSH(clusterId: string, config: SSHTunnelConfig & { localPort: number }): Promise<number> {
    const args = [
      "-N", // No remote command
      "-L",
      `${config.localPort}:${config.remoteHost}:${config.remotePort}`,
      "-p",
      String(config.port),
    ];

    // Auth method specific arguments
    if (config.authMethod === "key" && config.keyPath) {
      args.push("-i", config.keyPath);
      args.push("-o", "StrictHostKeyChecking=no"); // Skip host key verification
    } else if (config.authMethod === "agent") {
      args.push("-A"); // Agent forwarding
    }

    // For password auth, we would need sshpass or alternative
    // For now, we'll use key or agent
    if (config.authMethod === "password") {
      throw new Error(
        "Password authentication for SSH requires sshpass to be installed. Please use key-based authentication instead.",
      );
    }

    args.push(`${config.username}@${config.host}`);

    const proc = spawn("ssh", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    return this.handleProcess(clusterId, proc, config);
  }

  private async handleProcess(
    clusterId: string,
    proc: ChildProcess,
    config: (KubectlTunnelConfig | SSHTunnelConfig) & { localPort: number },
  ): Promise<number> {
    const localPort = config.localPort;

    return new Promise((resolve, reject) => {
      let connected = false;
      const timeout = setTimeout(() => {
        if (!connected) {
          proc.kill();
          reject(new Error("Port forward connection timeout"));
        }
      }, 15000); // 15 second timeout

      proc.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        console.log(`[${clusterId}] stdout:`, output);

        // kubectl: detect "Forwarding from" message
        if (!connected && config.type === "kubectl" && output.includes("Forwarding from")) {
          connected = true;
          clearTimeout(timeout);

          const status: PortForwardStatus = {
            clusterId,
            state: "connected",
            localPort,
            pid: proc.pid,
          };

          this.forwards.set(clusterId, {
            process: proc,
            config,
            status,
          });

          this.emit("status", status);
          resolve(localPort);
        }
      });

      proc.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();
        console.error(`[${clusterId}] stderr:`, output);

        // SSH typically outputs to stderr, check if connection is established
        if (!connected && config.type === "ssh") {
          // For SSH, we'll wait a bit and check if the process is still alive
          // SSH doesn't output connection success message typically
          setTimeout(() => {
            if (!connected && !proc.killed) {
              connected = true;
              clearTimeout(timeout);

              const status: PortForwardStatus = {
                clusterId,
                state: "connected",
                localPort,
                pid: proc.pid,
              };

              this.forwards.set(clusterId, {
                process: proc,
                config,
                status,
              });

              this.emit("status", status);
              resolve(localPort);
            }
          }, 2000); // Wait 2 seconds for SSH to establish
        }

        // Check for errors
        if (output.toLowerCase().includes("error") || output.toLowerCase().includes("failed")) {
          if (!connected) {
            clearTimeout(timeout);
            reject(new Error(output));
          }
        }
      });

      proc.on("error", (error) => {
        clearTimeout(timeout);
        console.error(`[${clusterId}] Process error:`, error);

        if (!connected) {
          reject(error);
        } else {
          this.handleDisconnect(clusterId, error.message);
        }
      });

      proc.on("exit", (code, signal) => {
        clearTimeout(timeout);
        console.log(`[${clusterId}] Process exited with code ${code}, signal ${signal}`);

        if (!connected) {
          reject(new Error(`Process exited with code ${code}`));
        } else {
          this.handleDisconnect(clusterId, `Process exited with code ${code}`);
        }
      });
    });
  }

  private handleDisconnect(clusterId: string, reason: string) {
    const forward = this.forwards.get(clusterId);
    if (forward) {
      this.emit("status", {
        clusterId,
        state: "disconnected",
        error: reason,
      } as PortForwardStatus);

      this.forwards.delete(clusterId);
    }
  }

  async stop(clusterId: string): Promise<void> {
    const forward = this.forwards.get(clusterId);
    if (forward) {
      forward.process.kill();
      this.forwards.delete(clusterId);

      this.emit("status", {
        clusterId,
        state: "disconnected",
      } as PortForwardStatus);
    }
  }

  async stopAll(): Promise<void> {
    for (const clusterId of this.forwards.keys()) {
      await this.stop(clusterId);
    }
  }

  getStatus(clusterId: string): PortForwardStatus | undefined {
    return this.forwards.get(clusterId)?.status;
  }

  getAllStatuses(): PortForwardStatus[] {
    return Array.from(this.forwards.values()).map((f) => f.status);
  }
}
