import { createServer } from "@opentui/ssh";
import { loadConfig, saveConfig } from "../config";
import { dirname } from "path";
import { mkdirSync } from "fs";

export const activeSshSessions = new Set<any>();

export async function startSshServers(
  onPlayerSession: (session: any) => void,
  onAdminSession: (session: any) => void
) {
  const config = loadConfig();

  const hostKeyPath = process.env.HOST_KEY_PATH || "./host_key";
  const adminHostKeyPath = process.env.ADMIN_HOST_KEY_PATH || "./admin_host_key";

  // Ensure host key parent directories exist
  const hostKeyDir = dirname(hostKeyPath);
  if (hostKeyDir && hostKeyDir !== ".") {
    mkdirSync(hostKeyDir, { recursive: true });
  }
  const adminHostKeyDir = dirname(adminHostKeyPath);
  if (adminHostKeyDir && adminHostKeyDir !== ".") {
    mkdirSync(adminHostKeyDir, { recursive: true });
  }

  // 1. GAME SSH SERVER (Port 2222 by default)
  const gameServer = createServer({
    hostKey: { path: hostKeyPath },
    auth: {
      publicKey: "any",
      none: true
    } as any,
    idleTimeout: "30m",
    startupBanner: true
  }).serve((session) => {
    activeSshSessions.add(session);
    session.onClose(() => {
      activeSshSessions.delete(session);
    });
    onPlayerSession(session);
  });

  await gameServer.listen(config.gamePort, "0.0.0.0");
  console.log(`Game SSH Server listening on port ${config.gamePort}...`);

  // 2. ADMIN SSH SERVER (Port 2223 by default)
  const adminServer = createServer({
    hostKey: { path: adminHostKeyPath },
    auth: {
      publicKey: {
        allow: ({ fingerprint }) => {
          const cfg = loadConfig();
          
          // Trust On First Use (TOFU) for first-time admin setup
          if (cfg.adminFingerprints.length === 0) {
            console.log(`[Admin Security] TOFU triggered. Registering admin fingerprint: ${fingerprint}`);
            cfg.adminFingerprints.push(fingerprint);
            saveConfig(cfg);
            return true;
          }

          const match = cfg.adminFingerprints.includes(fingerprint);
          if (!match) {
            console.warn(`[Admin Security] Blocked unauthorized connection from key fingerprint: ${fingerprint}`);
          }
          return match;
        }
      }
    },
    idleTimeout: "15m",
    startupBanner: true
  }).serve((session) => {
    onAdminSession(session);
  });

  await adminServer.listen(config.adminPort, "0.0.0.0");
  console.log(`Admin SSH Server listening on port ${config.adminPort}...`);

  return { gameServer, adminServer };
}
