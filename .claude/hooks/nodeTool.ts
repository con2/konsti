import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Hooks can fire with any working directory (e.g. server/ after a `cd`), but the
// repo-root-relative paths from `git status` and every tool config only resolve
// from the repository root. Anchor every spawn there
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

export type ToolStatus =
  | "ok"
  | "findings"
  | "crashed"
  | "unavailable"
  | "skipped";

export interface ToolResult {
  name: string;
  status: ToolStatus;
  exitCode: number | null;
  output: string;
  repro: string;
}

// Resolve a package's real JS entry point. Never resolve through
// node_modules/.bin: those are `.cmd` shims on Windows and spawning a `.cmd` is
// blocked since Node 20's CVE-2024-27980 fix. Spawning `node <file.js>` involves
// no shell at all, which is why these hooks need no cmd.exe workaround
export const resolvePackageBin = (
  root: string,
  pkg: string,
  relBin: string,
): string | null => {
  const direct = path.join(root, "node_modules", pkg, relBin);
  if (existsSync(direct)) {
    return direct;
  }
  // Survives a hoisting change or a workspace-local copy
  try {
    const resolve = createRequire(path.join(root, "package.json")).resolve;
    const candidate = path.join(
      path.dirname(resolve(`${pkg}/package.json`)),
      relBin,
    );
    return existsSync(candidate) ? candidate : null;
  } catch {
    return null;
  }
};

export interface RunToolOptions {
  name: string;
  root: string;
  pkg: string;
  relBin: string;
  args: string[];
  // Exit codes meaning "ran fine, found problems". Anything else non-zero is a
  // crash: eslint exits 1 for lint problems but 2 for a fatal config error, and
  // the two need opposite handling
  findingsExitCodes?: number[];
}

export const runNodeTool = (options: RunToolOptions): ToolResult => {
  const { name, root, pkg, relBin, args, findingsExitCodes = [1] } = options;
  const repro = `node node_modules/${pkg}/${relBin} ${args.join(" ")}`.trim();

  const entry = resolvePackageBin(root, pkg, relBin);
  if (!entry) {
    return {
      name,
      status: "unavailable",
      exitCode: null,
      output: `Could not resolve ${pkg} under ${root}. Run \`yarn install\`.`,
      repro,
    };
  }

  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    // The 1 MB default silently truncates a multi-project diagnostic cascade
    // into an ENOBUFS result, producing mangled output
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    // These tools write diagnostics to stdout and fatal errors to stderr, so
    // both streams are captured and concatenated below
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });

  // Typed as string, but null at runtime when the spawn itself failed
  const text = (chunk: string | null): string => chunk ?? "";
  const output = `${text(result.stdout)}${text(result.stderr)}`.trim();

  if (result.error ?? result.signal) {
    return {
      name,
      status: "crashed",
      exitCode: null,
      output:
        output ||
        `${name} did not run: ${String(result.error ?? result.signal)}`,
      repro,
    };
  }
  if (result.status === 0) {
    return { name, status: "ok", exitCode: 0, output, repro };
  }
  return {
    name,
    status: findingsExitCodes.includes(result.status ?? -1)
      ? "findings"
      : "crashed",
    exitCode: result.status,
    output,
    repro,
  };
};

// Yarn's own release file is plain CJS, so it can be spawned with node directly.
// Returns null unless exactly one release is present, letting callers keep a
// safe fallback rather than guessing
export const resolveYarnRelease = (root: string): string | null => {
  const dir = path.join(root, ".yarn", "releases");
  try {
    const matches = readdirSync(dir).filter((f) => /^yarn-.+\.cjs$/.test(f));
    return matches.length === 1 ? path.join(dir, matches[0]) : null;
  } catch {
    return null;
  }
};
