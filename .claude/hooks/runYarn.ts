import { execFileSync, type StdioOptions } from "node:child_process";

// Hooks can fire with any working directory (e.g. server/ after a `cd`), but the
// yarn scripts (knip, type-check, ...) and the repo-root-relative paths from
// `git status` only resolve from the repository root. Anchor every yarn call there
export const getProjectRoot = (): string => {
  if (process.env.CLAUDE_PROJECT_DIR) {
    return process.env.CLAUDE_PROJECT_DIR;
  }
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return process.cwd();
  }
};

// On Windows, Node.js can't spawn `yarn` directly (it's a `.cmd`), and spawning
// `yarn.cmd` is blocked since Node.js 20's CVE-2024-27980 fix. Route through
// `cmd.exe /c` so PATHEXT resolution handles the `.cmd` lookup
export const runYarn = (
  args: string[],
  stdio: StdioOptions = "inherit",
): void => {
  const cwd = getProjectRoot();
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/c", "yarn", ...args], { stdio, cwd });
  } else {
    execFileSync("yarn", args, { stdio, cwd });
  }
};
