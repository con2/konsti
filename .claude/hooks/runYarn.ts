import { execFileSync, type StdioOptions } from "node:child_process";

// On Windows, Node.js can't spawn `yarn` directly (it's a `.cmd`), and spawning
// `yarn.cmd` is blocked since Node.js 20's CVE-2024-27980 fix. Route through
// `cmd.exe /c` so PATHEXT resolution handles the `.cmd` lookup
export const runYarn = (
  args: string[],
  stdio: StdioOptions = "inherit",
): void => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/c", "yarn", ...args], { stdio });
  } else {
    execFileSync("yarn", args, { stdio });
  }
};
