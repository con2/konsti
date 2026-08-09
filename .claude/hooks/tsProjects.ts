export type TsProject = "shared" | "root" | "server" | "client";

// Smallest program first, so a broken shared type surfaces in about a second
// instead of after the client program has been built
export const TS_PROJECTS: readonly TsProject[] = [
  "shared",
  "root",
  "server",
  "client",
];

// Mirrors the type-check:* scripts in the root package.json
export const PROJECT_ARGS: Record<TsProject, string[]> = {
  shared: ["-p", "shared", "--noEmit"],
  root: ["-p", "tsconfig.json", "--noEmit"],
  server: ["-p", "server", "--noEmit"],
  client: ["-p", "client", "--noEmit"],
};

// Which tsc projects can a change to this path affect?
//
// A change under shared/ reaches all four. client and server import it directly,
// and the root project's playwright/ and scripts/ files import it through the
// `shared/*` alias even though the root tsconfig's `include` never names shared/
// - `include` is a seed set, not the file set, and TypeScript pulls in whatever
// those files import. Dropping the root project here would mean a shared type
// change could silently break a playwright page object.
//
// The projects also compile shared/ under different lib/target settings (root
// and shared: es2021 without DOM, client: es2021 with DOM, server: es2025
// without DOM), so none of the three is redundant with the others.
//
// The converse is safe: nothing outside client/ imports client/*, and nothing
// outside server/ imports server/*, so those map to themselves alone.
// A config change alters what every program compiles: the workspace tsconfigs
// all extend the root one, and a dependency change churns the .d.ts files they
// read. Exported so the hook's gates fire on these too - they are not .ts files,
// so an extension check alone would skip the very changes that affect everything
export const isBuildConfig = (changedPath: string): boolean => {
  const p = changedPath.replaceAll("\\", "/");
  return (
    /(^|\/)tsconfig[^/]*\.json$/.test(p) ||
    /(^|\/)package\.json$/.test(p) ||
    p === "yarn.lock" ||
    p === ".yarnrc.yml"
  );
};

const projectsFor = (changedPath: string): TsProject[] => {
  const p = changedPath.replaceAll("\\", "/");

  if (isBuildConfig(p)) {
    return [...TS_PROJECTS];
  }

  if (p.startsWith("shared/")) {
    return [...TS_PROJECTS];
  }
  if (p.startsWith("client/")) {
    return ["client"];
  }
  if (p.startsWith("server/")) {
    return ["server"];
  }
  if (
    p.startsWith("playwright/") ||
    p.startsWith("scripts/") ||
    p.startsWith(".claude/hooks/")
  ) {
    return ["root"];
  }
  // Root-level *.ts and *.d.ts (vitest.config.ts, eslint.config.ts, global.d.ts)
  if (!p.includes("/") && /\.tsx?$/.test(p)) {
    return ["root"];
  }

  // Unrecognised path: check everything rather than risk a false negative
  return [...TS_PROJECTS];
};

export const projectsForPaths = (paths: string[]): TsProject[] => {
  if (process.env.KONSTI_HOOK_FULL_TYPECHECK) {
    return [...TS_PROJECTS];
  }
  const selected = new Set<TsProject>();
  for (const p of paths) {
    for (const project of projectsFor(p)) {
      selected.add(project);
    }
  }
  return TS_PROJECTS.filter((project) => selected.has(project));
};
