import fs from "node:fs";
import path from "node:path";
// The explicit .ts extensions are required: plain node resolves these imports
// itself, without a bundler's extension guessing
import {
  serverCoverageExclude,
  serverCoverageInclude,
} from "./coverageGlobs.ts";
import {
  killPortListeners,
  killProcessTree,
  playwrightCli,
  repoRoot,
  runNodeCli,
  startProcess,
  waitForUrl,
} from "./e2eProcess.ts";
import { resolvePortOffset } from "./portOffset.ts";

// Runs the Playwright suite against a coverage-instrumented app and leaves
// istanbul-format coverage JSON behind for the merge step:
//
//   coverage/e2e/client/*.json           browser coverage: the client dev
//                                        server runs with COVERAGE=true, which
//                                        istanbul-instruments the served code
//                                        and collects window.__coverage__
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
// syntax that needs transformation (enums, path aliases, ...).

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
  // The client dev server runs with a strict port, so an occupied port fails
  // the run instead of silently testing another instance
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
