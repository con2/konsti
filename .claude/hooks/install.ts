import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { getProjectRoot, resolveYarnRelease } from "./nodeTool.ts";

// SessionStart hook: a fresh git worktree is an isolated copy with no
// node_modules, so every yarn-based tool (lint, type-check, tests) and the
// PostToolUse/Stop hooks fail with "Couldn't find the node_modules state file"
// until dependencies are installed. Provision them automatically when they're
// missing so a new worktree is ready to work in without a manual `yarn install`

const root = getProjectRoot();

// Yarn 4's node-modules linker writes this once an install completes; its
// absence means the worktree has never been installed (a bare node_modules
// directory can exist half-populated, so don't rely on the folder alone)
const stateFile = path.join(root, "node_modules", ".yarn-state.yml");
if (existsSync(stateFile)) {
  process.exit(0);
}

// Yarn's release file is plain CJS, so node can run it without a shell. This is
// the hook that rescues a broken worktree, so fall back to cmd.exe (which
// resolves the `yarn` .cmd shim via PATHEXT) whenever the release can't be
// pinned down rather than failing outright
const yarnRelease = resolveYarnRelease(root);

const runYarn = (args: string[]): boolean => {
  // Route yarn's output to our stderr so progress is visible without being
  // injected into the session context as SessionStart stdout would be
  const stdio = ["ignore", 2, 2] as const;
  if (yarnRelease) {
    const result = spawnSync(process.execPath, [yarnRelease, ...args], {
      cwd: root,
      stdio: [...stdio],
      windowsHide: true,
    });
    return result.status === 0;
  }
  try {
    if (process.platform === "win32") {
      execFileSync("cmd.exe", ["/c", "yarn", ...args], {
        stdio: [...stdio],
        cwd: root,
      });
    } else {
      execFileSync("yarn", args, { stdio: [...stdio], cwd: root });
    }
    return true;
  } catch {
    return false;
  }
};

process.stderr.write("node_modules missing - running yarn install...\n");
// --immutable fails if the lockfile would change; fall back to a plain install
// so lockfile drift doesn't leave the worktree unusable
if (!runYarn(["install", "--immutable"]) && !runYarn(["install"])) {
  process.stderr.write(
    "yarn install failed - run it manually before using yarn tooling\n",
  );
}
process.exit(0);
