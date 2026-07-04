import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Resolves this checkout's PORT_OFFSET (see "Running multiple local instances"
// in the README). An explicit PORT_OFFSET (shell env or .env file) always
// wins. Otherwise the offset is assigned automatically per git worktree: the
// main checkout keeps 0 (the classic 5000/8000 ports) and each linked worktree
// claims the smallest free slot in a registry stored in the shared .git
// directory. Because every worktree reads the same registry, they stay in sync
// about which ports are taken without manual bookkeeping. Outside a git
// checkout (e.g. Docker/CI builds) the offset is 0.
//
// The registry lives at <main checkout>/.git/konsti-port-offsets.json and maps
// worktree paths to offsets. Entries whose worktree no longer exists are
// pruned on each lookup so removed worktrees release their slot. The
// read-modify-write is not locked: two worktrees resolving their first offset
// at the exact same moment could race, which at worst assigns a duplicate —
// rerunning after removing the registry file recovers.

const registryFileName = "konsti-port-offsets.json";

const readRegistry = (registryPath: string): Record<string, number> => {
  const registry: Record<string, number> = {};
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    if (parsed === null || typeof parsed !== "object") {
      return registry;
    }
    for (const [worktree, offset] of Object.entries(parsed)) {
      if (typeof offset === "number" && Number.isInteger(offset)) {
        registry[worktree] = offset;
      }
    }
  } catch {
    // Missing or corrupt registry file starts over from an empty registry
  }
  return registry;
};

export const resolvePortOffset = (explicitValue?: string): number => {
  const explicit = explicitValue ?? process.env.PORT_OFFSET;
  if (explicit) {
    return Number(explicit) || 0;
  }

  try {
    const [toplevelRaw, commonDirRaw] = execSync(
      "git rev-parse --show-toplevel --git-common-dir",
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .trim()
      .split("\n");
    const toplevel = path.resolve(toplevelRaw.trim());
    const commonDir = path.resolve(commonDirRaw.trim());

    // The main checkout owns its .git directory; linked worktrees point at it
    if (commonDir === path.join(toplevel, ".git")) {
      return 0;
    }

    const registryPath = path.join(commonDir, registryFileName);
    // Recycle the offsets of removed worktrees
    const registry = Object.fromEntries(
      Object.entries(readRegistry(registryPath)).filter(([worktree]) =>
        fs.existsSync(worktree),
      ),
    );

    if (Object.hasOwn(registry, toplevel)) {
      return registry[toplevel];
    }

    const taken = new Set(Object.values(registry));
    let offset = 1;
    while (taken.has(offset)) {
      offset += 1;
    }
    registry[toplevel] = offset;
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

    console.warn(
      `[PORT_OFFSET] Assigned offset ${offset} to this worktree: client ${8000 + offset}, server ${5000 + offset}, dev database konsti-${offset} (registry: ${registryPath})`,
    );
    return offset;
  } catch {
    return 0;
  }
};
