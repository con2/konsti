import {
  spawn,
  spawnSync,
  type ChildProcess,
  type SpawnSyncReturns,
} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
// The explicit .ts extensions are required: plain node resolves these imports
// itself, without a bundler's extension guessing
import {
  serverCoverageExclude,
  serverCoverageInclude,
} from "./coverageGlobs.ts";
import { resolvePortOffset } from "./portOffset.ts";

// Runs the Playwright suite against a coverage-instrumented app and leaves
// istanbul-format coverage JSON behind for scripts/mergeCoverageReport.ts:
//
//   coverage/e2e/client/*.json           browser coverage: the client dev
//                                        server runs with COVERAGE=true, which
//                                        istanbul-instruments the served code
//                                        and collects window.__coverage__ via
//                                        client/coverageCollectorPlugin.ts
//   coverage/e2e/server/coverage-final.json
//                                        server coverage: the server runs with
//                                        NODE_V8_COVERAGE, flushes it via the
//                                        dev-only /api/write-coverage endpoint,
//                                        and c8 remaps it onto the TS sources
//
// Invoked by `yarn coverage:e2e` (which starts the MongoDB container first).
// Extra CLI arguments are passed to `playwright test`, so a subset run is e.g.
// `yarn coverage:e2e programSearch`. Exits with Playwright's exit code.
//
// NOTE: this file runs with plain `node`, so it must stay free of TypeScript
// syntax that needs transformation (enums, path aliases, ...)

const repoRoot = path.join(import.meta.dirname, "..");

// Resolve the per-worktree port offset once and pin it into every child
// process via PORT_OFFSET (explicit values win over the registry), so the
// server, the client, Playwright, and this script's polling and cleanup are
// guaranteed to agree on the ports
const portOffset = resolvePortOffset();
const portOffsetEnv = { PORT_OFFSET: String(portOffset) };
const serverUrl = `http://localhost:${5000 + portOffset}`;
const clientUrl = `http://127.0.0.1:${8000 + portOffset}`;

const e2eCoverageDir = path.join(repoRoot, "coverage", "e2e");
const v8CoverageDir = path.join(e2eCoverageDir, "server-v8");

const startProcess = (
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

const killProcessTree = (child: ChildProcess): void => {
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
// stale instance)
const killPortListeners = (port: number): void => {
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

const waitForUrl = async (
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
const runNodeCli = (
  cliPath: string,
  args: string[],
  extraEnv: Record<string, string> = {},
): SpawnSyncReturns<Buffer> =>
  spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });

const playwrightCli = path.join(
  repoRoot,
  "node_modules",
  "playwright",
  "cli.js",
);
const c8Cli = path.join(repoRoot, "node_modules", "c8", "bin", "c8.js");

const main = async (): Promise<number> => {
  fs.rmSync(e2eCoverageDir, { recursive: true, force: true });
  fs.mkdirSync(v8CoverageDir, { recursive: true });

  console.log("Starting server and client with coverage instrumentation");
  const server = startProcess("yarn workspace server start:test:coverage", {
    NODE_V8_COVERAGE: v8CoverageDir,
    // Keep the server's per-request info logs out of the Playwright output;
    // an explicit LOG_LEVEL still wins
    LOG_LEVEL: process.env.LOG_LEVEL ?? "warn",
    ...portOffsetEnv,
  });
  // Vite runs with strictPort (see client/vite.config.ts), so an occupied
  // port fails the run instead of silently testing another instance
  const client = startProcess("yarn workspace client start", {
    COVERAGE: "true",
    ...portOffsetEnv,
  });

  let playwrightStatus: number | undefined;
  try {
    const serverReady = await waitForUrl(
      `${serverUrl}/api/health`,
      server,
      120_000,
    );
    const clientReady =
      serverReady && (await waitForUrl(`${clientUrl}/`, client, 120_000));
    if (!serverReady || !clientReady) {
      return 1;
    }

    runNodeCli(playwrightCli, ["install"]);
    console.log("Running Playwright suite");
    const playwright = runNodeCli(
      playwrightCli,
      ["test", "--config", "./playwright/", ...process.argv.slice(2)],
      portOffsetEnv,
    );
    playwrightStatus = playwright.status ?? 1;

    // Ask the server to flush its V8 coverage to NODE_V8_COVERAGE before the
    // process is killed (a hard kill would discard it)
    console.log("Flushing server coverage");
    try {
      // ApiDevEndpoint.WRITE_COVERAGE (not imported: enums don't survive
      // node's type stripping)
      const response = await fetch(`${serverUrl}/api/write-coverage`, {
        method: "POST",
      });
      if (!response.ok) {
        console.error(`Flushing server coverage failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Flushing server coverage failed:", error);
    }
  } finally {
    killProcessTree(client);
    killProcessTree(server);
    killPortListeners(8000 + portOffset);
    killPortListeners(5000 + portOffset);
  }

  // Remap the V8 coverage onto the TS sources and convert it to istanbul JSON
  console.log("Converting server coverage to istanbul format");
  const c8 = runNodeCli(c8Cli, [
    "report",
    "--temp-directory",
    v8CoverageDir,
    "--report-dir",
    path.join(e2eCoverageDir, "server"),
    "--reporter",
    "json",
    ...serverCoverageInclude.flatMap((glob) => ["--include", glob]),
    ...serverCoverageExclude.flatMap((glob) => ["--exclude", glob]),
    "--exclude-after-remap",
  ]);
  if (c8.status !== 0) {
    console.error("Converting server coverage failed");
    return playwrightStatus === 0 ? 1 : playwrightStatus;
  }

  return playwrightStatus;
};

process.exitCode = await main();
