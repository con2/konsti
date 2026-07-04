// The istanbul packages are CommonJS whose named exports node cannot detect,
// so they must be imported via their default export
import fs from "node:fs";
import path from "node:path";
import libCoverage, {
  type CoverageMap,
  type FileCoverageData,
  type Range,
  type Totals,
} from "istanbul-lib-coverage";
import libReport from "istanbul-lib-report";
import libSourceMaps from "istanbul-lib-source-maps";
import reports from "istanbul-reports";

// Merges the coverage produced by `yarn coverage` into one report for the
// whole project (client + server + shared):
//
//   coverage/vitest/coverage-final.json      unit tests (`yarn coverage:vitest`)
//   coverage/e2e/client/*.json               Playwright browser coverage
//   coverage/e2e/server/coverage-final.json  Playwright server coverage
//
// The vitest data is the canonical structure: it enumerates every source file
// with istanbul's AST-based statement/function/branch maps. The E2E inputs
// cannot be merged into it key-by-key - the browser data is instrumented after
// Vite's transforms and the server data comes from V8 coverage - so instead
// their hits are projected onto the canonical maps:
//
// - Statements match by exact start position first (the browser data matches
//   those after its embedded source maps are applied). The line fallback for
//   the line-based V8 server data credits only the FIRST statement on the
//   line: a line hit proves the line's first statement started executing, but
//   says nothing about later statements on the same line (e.g. the `return`
//   in `if (x) return;`)
// - Functions credit on exact start matches (signature or body position), and
//   otherwise a function counts as covered when any line inside its body has
//   hits - the V8-derived data's own function entries are mostly transform
//   helpers with meaningless positions, so they cannot be position-matched
// - Branch hits are only projected on exact matches, so branch coverage is
//   mostly determined by the unit tests
//
// Writes html + lcov + text reports to coverage/report. Missing inputs are
// skipped with a warning so a partial run (e.g. vitest only) still reports.
//
// NOTE: this file runs with plain `node`, so it must stay free of TypeScript
// syntax that needs transformation (enums, path aliases, ...)

const repoRoot = path.join(import.meta.dirname, "..");
const coverageDir = path.join(repoRoot, "coverage");
const reportDir = path.join(coverageDir, "report");

type CoverageData = Record<string, FileCoverageData>;

// Reads every coverage JSON in a directory. A local run produces one file per
// input; sharded CI runs drop one file per shard into the same directory
const readCoverageJsonDir = (dir: string, label: string): CoverageData[] => {
  const jsonFiles = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((file) => file.endsWith(".json"))
    : [];
  if (jsonFiles.length === 0) {
    console.warn(`No ${label} found, skipping`);
    return [];
  }
  return jsonFiles.map(
    (file) =>
      JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as CoverageData,
  );
};

// The standalone pipeline stages (`yarn coverage:vitest`, `yarn coverage:e2e`)
// only clean their own directories, so warn when the E2E data looks like a
// leftover from an older run: projecting stale hits onto freshly built maps
// misattributes them when source positions have shifted in between
const warnAboutStaleE2eCoverage = (): void => {
  const newestMtimeMs = (dir: string): number => {
    if (!fs.existsSync(dir)) {
      return 0;
    }
    return Math.max(
      0,
      ...fs
        .readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => fs.statSync(path.join(dir, file)).mtimeMs),
    );
  };
  const vitestMtime = newestMtimeMs(path.join(coverageDir, "vitest"));
  const e2eMtime = Math.max(
    newestMtimeMs(path.join(coverageDir, "e2e", "client")),
    newestMtimeMs(path.join(coverageDir, "e2e", "server")),
  );
  const staleThresholdMs = 5 * 60 * 1000;
  if (
    vitestMtime > 0 &&
    e2eMtime > 0 &&
    vitestMtime - e2eMtime > staleThresholdMs
  ) {
    const minutes = Math.round((vitestMtime - e2eMtime) / 60_000);
    console.warn(
      `Playwright coverage data is ${minutes} minutes older than the vitest coverage - if sources changed in between, rerun \`yarn coverage:e2e\` to avoid misattributed hits`,
    );
  }
};

// Applies the source maps that vite-plugin-istanbul embeds into the coverage
// data, turning served-file positions back into original source positions
const readClientE2eCoverage = async (): Promise<CoverageData> => {
  const dataList = readCoverageJsonDir(
    path.join(coverageDir, "e2e", "client"),
    "playwright client coverage",
  );
  if (dataList.length === 0) {
    return {};
  }
  const coverageMap = libCoverage.createCoverageMap({});
  for (const data of dataList) {
    coverageMap.merge(data);
  }
  const remapped = await libSourceMaps
    .createSourceMapStore()
    .transformCoverage(coverageMap);
  // remapped.data holds FileCoverage class instances - unwrap to plain data
  return Object.fromEntries(
    remapped.files().map((file) => [file, remapped.fileCoverageFor(file).data]),
  );
};

const startKey = (range: Range): string =>
  `${range.start.line}|${range.start.column}`;

interface PositionIndex {
  byStart: Map<string, string[]>;
  // Bucket entries keep the start column so lookups can pick the first
  // item on a line
  byLine: Map<number, { column: number; id: string }[]>;
}

const addToIndex = (index: PositionIndex, id: string, range: Range): void => {
  const key = startKey(range);
  const byStartIds = index.byStart.get(key);
  if (byStartIds) {
    if (!byStartIds.includes(id)) {
      byStartIds.push(id);
    }
  } else {
    index.byStart.set(key, [id]);
  }
  const byLineEntries = index.byLine.get(range.start.line);
  const entry = { column: range.start.column, id };
  if (byLineEntries) {
    if (byLineEntries.every((existing) => existing.id !== id)) {
      byLineEntries.push(entry);
    }
  } else {
    index.byLine.set(range.start.line, [entry]);
  }
};

const buildIndex = (rangesById: Record<string, Range[]>): PositionIndex => {
  const index: PositionIndex = { byStart: new Map(), byLine: new Map() };
  for (const [id, ranges] of Object.entries(rangesById)) {
    for (const range of ranges) {
      addToIndex(index, id, range);
    }
  }
  for (const entries of index.byLine.values()) {
    entries.sort((a, b) => a.column - b.column);
  }
  return index;
};

// A line hit only proves the first item on the line started executing
const firstOnLine = (
  index: PositionIndex,
  line: number,
): string[] | undefined => {
  const entries = index.byLine.get(line);
  return entries ? [entries[0].id] : undefined;
};

// Adds the hits of a foreign coverage entry (browser or V8-derived) to the
// canonical istanbul entry of the same file
const projectHits = (
  canonical: FileCoverageData,
  foreign: FileCoverageData,
): void => {
  const statements = buildIndex(
    Object.fromEntries(
      Object.entries(canonical.statementMap).map(([id, range]) => [
        id,
        [range],
      ]),
    ),
  );
  for (const [id, range] of Object.entries(foreign.statementMap)) {
    const hits = foreign.s[id];
    if (!hits) {
      continue;
    }
    const targets =
      statements.byStart.get(startKey(range)) ??
      firstOnLine(statements, range.start.line) ??
      [];
    for (const target of targets) {
      canonical.s[target] += hits;
    }
  }

  // Functions are indexed under both decl (signature) and loc (body) because
  // different instrumenters anchor a function at either position. Only exact
  // matches credit through the foreign fnMap: the V8-derived data's function
  // entries are dominated by transform helpers (e.g. esbuild's __name) with
  // meaningless remapped positions, so a line fallback would credit the wrong
  // functions
  const functions = buildIndex(
    Object.fromEntries(
      Object.entries(canonical.fnMap).map(([id, fn]) => [
        id,
        [fn.loc, fn.decl],
      ]),
    ),
  );
  for (const [id, fn] of Object.entries(foreign.fnMap)) {
    const hits = foreign.f[id];
    if (!hits) {
      continue;
    }
    const targets =
      functions.byStart.get(startKey(fn.loc)) ??
      functions.byStart.get(startKey(fn.decl)) ??
      [];
    for (const target of targets) {
      canonical.f[target] += hits;
    }
  }

  // Range fallback: a covered line inside a function's body proves the
  // function executed (defining a nested function already executes a line of
  // its parent). This is what makes the line-based server data contribute
  // function coverage at all
  const coveredLines = new Set<number>();
  for (const [id, range] of Object.entries(foreign.statementMap)) {
    if (foreign.s[id]) {
      coveredLines.add(range.start.line);
    }
  }
  for (const [id, fn] of Object.entries(canonical.fnMap)) {
    if (canonical.f[id] > 0) {
      continue;
    }
    for (let line = fn.decl.start.line; line <= fn.loc.end.line; line++) {
      if (coveredLines.has(line)) {
        canonical.f[id] += 1;
        break;
      }
    }
  }

  const canonicalBranchIdsByStart = new Map<string, string>();
  for (const [id, branch] of Object.entries(canonical.branchMap)) {
    canonicalBranchIdsByStart.set(startKey(branch.locations[0]), id);
  }
  for (const [id, branch] of Object.entries(foreign.branchMap)) {
    const target = canonicalBranchIdsByStart.get(startKey(branch.locations[0]));
    if (target === undefined) {
      continue;
    }
    const targetHits = canonical.b[target];
    const foreignHits = foreign.b[id];
    if (targetHits.length !== foreignHits.length) {
      continue;
    }
    for (const [index, hits] of foreignHits.entries()) {
      targetHits[index] += hits;
    }
  }
};

const buildMergedCoverageMap = async (): Promise<CoverageMap | undefined> => {
  const vitestDataList = readCoverageJsonDir(
    path.join(coverageDir, "vitest"),
    "vitest unit test coverage",
  );
  const clientE2eData = await readClientE2eCoverage();
  const serverE2eDataList = readCoverageJsonDir(
    path.join(coverageDir, "e2e", "server"),
    "playwright server coverage",
  );

  // Normalize file keys: the inputs mix path styles (forward vs backward
  // slashes on Windows) and the same file must end up in a single entry
  const canonical = new Map<string, FileCoverageData>();
  for (const [file, entry] of vitestDataList.flatMap(
    Object.entries<FileCoverageData>,
  )) {
    const normalizedPath = path.resolve(file);
    canonical.set(normalizedPath, { ...entry, path: normalizedPath });
  }

  const foreignEntries = [
    ...Object.entries(clientE2eData),
    ...serverE2eDataList.flatMap(Object.entries<FileCoverageData>),
  ];
  if (canonical.size === 0 && foreignEntries.length === 0) {
    return undefined;
  }

  // Project before handing the data to istanbul: createCoverageMap does not
  // copy the entries, but mutating them afterwards would be fragile
  const foreignOnly: CoverageData[] = [];
  for (const [file, entry] of foreignEntries) {
    const normalizedPath = path.resolve(file);
    const canonicalEntry = canonical.get(normalizedPath);
    if (canonicalEntry) {
      projectHits(canonicalEntry, entry);
    } else {
      foreignOnly.push({
        [normalizedPath]: { ...entry, path: normalizedPath },
      });
    }
  }

  const coverageMap = libCoverage.createCoverageMap(
    Object.fromEntries(canonical),
  );
  for (const data of foreignOnly) {
    coverageMap.merge(data);
  }
  return coverageMap;
};

// Markdown totals for CI: the coverage workflow appends this to the GitHub
// Actions step summary
const writeMarkdownSummary = (coverageMap: CoverageMap): void => {
  const summary = coverageMap.getCoverageSummary();
  const row = (label: string, totals: Totals): string =>
    `| ${label} | ${totals.pct}% | ${totals.covered} / ${totals.total} |`;
  fs.writeFileSync(
    path.join(reportDir, "summary.md"),
    [
      "### Combined test coverage (vitest + Playwright)",
      "",
      "| Metric | Coverage | Covered / Total |",
      "| --- | --- | --- |",
      row("Statements", summary.statements),
      row("Branches", summary.branches),
      row("Functions", summary.functions),
      row("Lines", summary.lines),
      "",
    ].join("\n"),
  );
};

warnAboutStaleE2eCoverage();
const coverageMap = await buildMergedCoverageMap();
if (coverageMap === undefined) {
  console.error("No coverage data found - run `yarn coverage` first");
  process.exitCode = 1;
} else {
  const context = libReport.createContext({ dir: reportDir, coverageMap });
  reports.create("text").execute(context);
  reports.create("lcovonly").execute(context);
  reports.create("html").execute(context);
  writeMarkdownSummary(coverageMap);
  console.log(
    `\nCombined coverage report: ${path.join(reportDir, "index.html")}`,
  );
}
