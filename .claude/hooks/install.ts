import { existsSync } from "node:fs";
import path from "node:path";
import { getProjectRoot, runYarn } from "./runYarn";

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

process.stderr.write("node_modules missing — running yarn install...\n");
try {
  // Route yarn's output to our stderr so progress is visible without being
  // injected into the session context as SessionStart stdout would be
  runYarn(["install", "--immutable"], ["ignore", 2, 2]);
} catch {
  // --immutable fails if the lockfile would change; fall back to a plain
  // install so lockfile drift doesn't leave the worktree unusable
  try {
    runYarn(["install"], ["ignore", 2, 2]);
  } catch {
    process.stderr.write(
      "yarn install failed — run it manually before using yarn tooling\n",
    );
  }
}
process.exit(0);
