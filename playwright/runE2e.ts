import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Runs the containerized Playwright E2E suite. Invoked by the
// `docker-compose:test` package script (see playwright/CLAUDE.md)

// The playwright Docker image is tagged from the installed @playwright/test
// version so the image matches the runner exactly
const { devDependencies } = JSON.parse(
  readFileSync("package.json", "utf8"),
) as { devDependencies: Record<string, string> };

const composeFiles = [
  "-f",
  "./docker/docker-compose.yml",
  "-f",
  "./playwright/docker-compose.yml",
];

const env = {
  ...process.env,
  PLAYWRIGHT_VERSION: devDependencies["@playwright/test"],
  APP_SETTINGS: "ci",
  // Bake builds the server and playwright images in parallel; explicit opt-in
  // covers compose versions where Bake isn't the default builder yet
  COMPOSE_BAKE: "true",
};

const dockerCompose = (args: string[]): number => {
  const { status } = spawnSync(
    "docker",
    ["compose", ...composeFiles, ...args],
    { stdio: "inherit", env },
  );
  return status ?? 1;
};

// Build both images in one compose invocation so Bake runs them in parallel
// (the server build finishes inside the longer playwright build). Building the
// playwright image every run keeps local runs on the current specs — a bare
// `up` would silently reuse a stale cached image
const buildStatus = dockerCompose(["build", "server", "playwright"]);

// Run the suite and exit with Playwright's own exit code
const upStatus =
  buildStatus === 0
    ? dockerCompose([
        "up",
        "--attach",
        "playwright",
        "--remove-orphans",
        "--exit-code-from",
        "playwright",
        "--abort-on-container-exit",
      ])
    : buildStatus;

process.exitCode = upStatus;
