import { spawnSync } from "node:child_process";
// The explicit .ts extensions are required: plain node resolves these imports
// itself, without a bundler's extension guessing
import {
  installBrowsersOutsideCi,
  isServerPortFree,
  killOnInterrupt,
  killPortListeners,
  killProcessTree,
  playwrightCli,
  repoRoot,
  runNodeCli,
  startProcess,
  waitForUrl,
} from "./e2eProcess.ts";
import { resolvePortOffset } from "./portOffset.ts";

// Runs the Playwright suite against the ci client build, served by the server
// in ci mode along with the Kompassi mock. Extra arguments go to
// `playwright test`. Runs with plain `node`, so no TypeScript syntax that
// needs transformation (enums, path aliases, ...).

// Resolve the per-worktree port offset once and pin it into every child
// process via PORT_OFFSET (explicit values win over the registry), so the
// client build, the server, Playwright, and this script's polling and cleanup
// are guaranteed to agree on the port
const portOffset = resolvePortOffset();
const portOffsetEnv = { PORT_OFFSET: String(portOffset) };
const serverUrl = `http://localhost:${5000 + portOffset}`;

const main = async (): Promise<number> => {
  if (!(await isServerPortFree(serverUrl))) {
    return 1;
  }

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
    // The specs clear the database, so they get one of their own rather than
    // the dev database the shared Mongo container also holds
    DB_NAME: `konsti-e2e-${portOffset}`,
    ...portOffsetEnv,
  });
  killOnInterrupt([server]);

  try {
    const serverReady = await waitForUrl(
      `${serverUrl}/api/health`,
      server,
      120_000,
    );
    if (!serverReady) {
      return 1;
    }

    installBrowsersOutsideCi();
    console.log("Running Playwright suite");
    const playwright = runNodeCli(
      playwrightCli,
      ["test", "--config", "./playwright/", ...process.argv.slice(2)],
      {
        // The server serves the SPA build as well as the API
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
