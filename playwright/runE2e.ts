import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Runs the containerized Playwright E2E suite. Invoked by the
// `docker-compose:run-e2e` package script (see playwright/CLAUDE.md)

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
};

const dockerCompose = (args: string[]): number => {
  const { status } = spawnSync(
    "docker",
    ["compose", ...composeFiles, ...args],
    { stdio: "inherit", env },
  );
  return status ?? 1;
};

// Rebuild only the test image so local runs always use the current specs; the
// heavyweight server image is built separately by docker:build-ci
const buildStatus = dockerCompose(["build", "playwright"]);

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
