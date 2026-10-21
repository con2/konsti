import {
  type ChildProcess,
  type SpawnSyncReturns,
  spawn,
  spawnSync,
} from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Process helpers shared by the E2E runners, which start the app on the host,
// run the Playwright suite against it, and tear the app down again.
//
// NOTE: this file runs with plain `node`, so it must stay free of TypeScript
// syntax that needs transformation (enums, path aliases, ...).

export const repoRoot = path.join(import.meta.dirname, "..");

export const playwrightCli = path.join(
  repoRoot,
  "node_modules",
  "playwright",
  "cli.js",
);

export const startProcess = (
  command: string,
  extraEnv: Record<string, string>,
): ChildProcess =>
  spawn(command, {
    cwd: repoRoot,
    shell: true,
    stdio: "inherit",
    // On POSIX the shell gets its own process group so the whole tree can be
    // killed at once; on Windows taskkill /T handles the tree
    detached: process.platform !== "win32",
    env: { ...process.env, ...extraEnv },
  });

export const killProcessTree = (child: ChildProcess): void => {
  if (child.pid === undefined || child.exitCode !== null) {
    return;
  }
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    process.kill(-child.pid, "SIGTERM");
  }
};

// Kills whatever still listens on the port. On Windows taskkill /T can miss
// children when an intermediate process has already exited, which leaves an
// orphaned dev server behind (and the next run would then silently test a
// stale instance).
export const killPortListeners = (port: number): void => {
  if (process.platform !== "win32") {
    // POSIX kills the whole process group in killProcessTree already
    return;
  }
  const netstat = spawnSync("netstat", ["-ano"], { encoding: "utf8" });
  const pids = new Set<string>();
  for (const line of netstat.stdout.split("\n")) {
    if (line.includes(`:${port} `) && line.includes("LISTENING")) {
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && pid !== "0") {
        pids.add(pid);
      }
    }
  }
  for (const pid of pids) {
    spawnSync("taskkill", ["/pid", pid, "/T", "/F"], { stdio: "ignore" });
  }
};

export const waitForUrl = async (
  url: string,
  child: ChildProcess,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      console.error(
        `Process exited with code ${child.exitCode} before ${url} was ready - is the port free?`,
      );
      return false;
    }
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // Not up yet
    }
    await delay(1000);
  }
  console.error(`Timed out waiting for ${url}`);
  return false;
};

// Runs a node CLI by its entry file with an args ARRAY: no shell is involved,
// so forwarded arguments cannot be mangled by cmd.exe/sh metacharacter or
// quoting rules
export const runNodeCli = (
  cliPath: string,
  args: string[],
  extraEnv: Record<string, string> = {},
): SpawnSyncReturns<Buffer> =>
  spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
