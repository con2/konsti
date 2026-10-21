import { spawnSync } from "node:child_process";
// The explicit .ts extensions are required: plain node resolves these imports
// itself, without a bundler's extension guessing
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

// Runs the Playwright suite against the production-style app on the host: the
// ci client build served as static files by the server running in ci mode,
// which also serves the Kompassi mock the login spec needs.
//
// Invoked by `yarn e2e` (which starts the MongoDB container first). Extra CLI
// arguments are passed to `playwright test`, so a shard or subset run is e.g.
// `yarn e2e --shard=1/7` or `yarn e2e programSearch`. Exits with Playwright's
// exit code. Browsers are not installed here: CI installs the ones the
// enabled projects need, and `yarn playwright` covers local setup.
//
// NOTE: this file runs with plain `node`, so it must stay free of TypeScript
// syntax that needs transformation (enums, path aliases, ...).

// Resolve the per-worktree port offset once and pin it into every child
// process via PORT_OFFSET (explicit values win over the registry), so the
// client build, the server, Playwright, and this script's polling and cleanup
// are guaranteed to agree on the port
const portOffset = resolvePortOffset();
const portOffsetEnv = { PORT_OFFSET: String(portOffset) };
const serverUrl = `http://localhost:${5000 + portOffset}`;

const main = async (): Promise<number> => {
  console.log("Building client");
  const build = spawnSync("yarn build-front:ci", {
    cwd: repoRoot,
    shell: true,
    stdio: "inherit",
    env: { ...process.env, ...portOffsetEnv },
  });
  if (build.status !== 0) {
    console.error("Building client failed");
    return build.status ?? 1;
  }

  console.log("Starting server");
  const server = startProcess("yarn workspace server start:ci", {
    // Keep the server's per-request info logs out of the Playwright output;
    // an explicit LOG_LEVEL still wins
    LOG_LEVEL: process.env.LOG_LEVEL ?? "warn",
    ...portOffsetEnv,
  });

  try {
    const serverReady = await waitForUrl(
      `${serverUrl}/api/health`,
      server,
      120_000,
    );
    if (!serverReady) {
      return 1;
    }

    console.log("Running Playwright suite");
    const playwright = runNodeCli(
      playwrightCli,
      ["test", "--config", "./playwright/", ...process.argv.slice(2)],
      {
        // The server serves the SPA and the API from one origin
        PLAYWRIGHT_BASEURL: serverUrl,
        ...portOffsetEnv,
      },
    );
    return playwright.status ?? 1;
  } finally {
    killProcessTree(server);
    killPortListeners(5000 + portOffset);
  }
};

process.exitCode = await main();
