import { allPaths, existingPaths, getGitChanges } from "./gitChanges.ts";
import { type ToolResult, getProjectRoot, runNodeTool } from "./nodeTool.ts";
import { getSessionScope } from "./transcriptFiles.ts";
import { PROJECT_ARGS, isBuildConfig, projectsForPaths } from "./tsProjects.ts";

// Stop hook: type-check, lint and knip the session's changes before finishing.
//
// These three ran as separate hooks until they were merged here. Claude Code
// runs every hook for an event concurrently, so that had eslint (type-aware),
// tsc and knip building TypeScript programs at the same time; the contention,
// not the tools, was what produced minute-long runs and timeouts. Running them
// one at a time from a single process is both faster in wall clock and safe
// against knip's native-memory parser blowing up alongside another program

interface HookInput {
  transcript_path?: string;
}

const SOFT_BUDGET_MS = 150_000;
const MAX_LINES_PER_TOOL = 150;
const MAX_CHARS_PER_TOOL = 12_000;
const MAX_REPORT_CHARS = 40_000;
// Well under Windows' ~32k CreateProcess command-line limit
const MAX_ARGV_CHARS = 24_000;
const MAX_ARGV_ENTRIES = 200;

const isTypeScript = (p: string): boolean => /\.tsx?$/.test(p);
const isCodeFile = (p: string): boolean => /\.(?:tsx?|jsx?)$/.test(p);

const readStdin = async (): Promise<HookInput> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString()) as HookInput;
  } catch {
    return {};
  }
};

const truncate = (text: string): string => {
  const lines = text.split("\n");
  let out =
    lines.length > MAX_LINES_PER_TOOL
      ? [
          ...lines.slice(0, MAX_LINES_PER_TOOL),
          `... ${lines.length - MAX_LINES_PER_TOOL} more lines`,
        ].join("\n")
      : text;
  if (out.length > MAX_CHARS_PER_TOOL) {
    out = `${out.slice(0, MAX_CHARS_PER_TOOL)}\n... truncated`;
  }
  return out;
};

// Findings first: the model reads the top of the block reason, and an unbounded
// cascade from one broken shared type would otherwise flood the context window
const formatReport = (results: ToolResult[]): string => {
  const findings = results.filter((r) => r.status === "findings");
  const broken = results.filter(
    (r) => r.status === "crashed" || r.status === "unavailable",
  );
  const reported = [...findings, ...broken];

  const headline = findings.length
    ? `Stop checks failed: ${findings.map((r) => r.name).join(", ")}`
    : `Stop checks could not run: ${broken.map((r) => r.name).join(", ")}`;

  const sections = reported.map(
    (r) => `=== ${r.name} ===\n${truncate(r.output) || "(no output)"}`,
  );
  const repro = reported.filter((r) => r.repro).map((r) => `  ${r.repro}`);

  const report = [
    headline,
    "",
    ...sections,
    "",
    findings.length
      ? "Fix the issues above before finishing. Reproduce individually:"
      : "This is a tooling problem, not a code problem. Reproduce individually:",
    ...repro,
  ].join("\n");

  return report.length > MAX_REPORT_CHARS
    ? `${report.slice(0, MAX_REPORT_CHARS)}\n... report truncated`
    : report;
};

const input = await readStdin();
const root = getProjectRoot();

const changes = getGitChanges(root);
if (changes.length === 0) {
  process.exit(0);
}

const scope = getSessionScope(input.transcript_path, root);
const inSession = (p: string): boolean => !scope.known || scope.touched(p);

// Two path lists, because the checks disagree on deletions by design. eslint
// can only lint files that still exist, while a deletion is exactly the kind of
// change type-check and knip need to see
const sessionPaths = allPaths(changes).filter(inSession);
const lintTargets = existingPaths(changes).filter(isCodeFile).filter(inSession);
// Config changes count as well as source changes: a tsconfig or dependency edit
// is not a .ts file but changes what every program compiles
const runTypecheck = sessionPaths.some(
  (p) => isTypeScript(p) || isBuildConfig(p),
);
const runKnip = sessionPaths.some((p) => isCodeFile(p) || isBuildConfig(p));

const results: ToolResult[] = [];
const startedAt = Date.now();
const overBudget = (): boolean => Date.now() - startedAt > SOFT_BUDGET_MS;

// A hard hook timeout kills the process and reports nothing, so degrade to
// partial results instead of running past the budget
const skipped = (name: string): ToolResult => ({
  name,
  status: "skipped",
  exitCode: null,
  output: "",
  repro: "",
});

// One tool throwing must not take the other two down; separate processes used to
// give that isolation for free
const guard = (name: string, run: () => ToolResult): ToolResult => {
  try {
    return run();
  } catch (error) {
    return {
      name,
      status: "crashed",
      exitCode: null,
      output: error instanceof Error ? error.message : String(error),
      repro: "",
    };
  }
};

const finish = (): never => {
  if (results.some((r) => r.status === "findings")) {
    process.stderr.write(`${formatReport(results)}\n`);
    process.exit(2);
  }
  // A missing binary or a broken config is an operator problem the model can't
  // fix, so surface it without blocking the turn
  if (
    results.some((r) => r.status === "crashed" || r.status === "unavailable")
  ) {
    process.stderr.write(`${formatReport(results)}\n`);
    process.exit(1);
  }
  process.exit(0);
};

// Stage 1: type-check only the projects the changed paths can affect
if (runTypecheck) {
  for (const project of projectsForPaths(sessionPaths)) {
    const name = `type-check: ${project}`;
    results.push(
      overBudget()
        ? skipped(name)
        : guard(name, () =>
            runNodeTool({
              name,
              root,
              pkg: "typescript",
              relBin: "bin/tsc",
              args: PROJECT_ARGS[project],
              findingsExitCodes: [1, 2],
            }),
          ),
    );
  }
  // Stop here on a type error. Under strictTypeChecked a bad type makes every
  // downstream expression `any`, which detonates the no-unsafe-* rules, and knip
  // reports phantom unused exports when a module fails to resolve - so running
  // on would spend seconds producing findings that vanish once this is fixed
  if (results.some((r) => r.status === "findings")) {
    finish();
  }
}

// Stage 2: lint and knip. Both run - a knip finding isn't caused by an eslint one
if (lintTargets.length > 0) {
  // A very wide change (rebase, generated files) can push the file list past the
  // command-line limit; fall back to the directories those files live in, which
  // still covers everything eslint needs to see
  const argvTooLong =
    lintTargets.length > MAX_ARGV_ENTRIES ||
    lintTargets.join(" ").length > MAX_ARGV_CHARS;
  const eslintTargets = argvTooLong
    ? [...new Set(lintTargets.map((p) => p.split("/", 1)[0]))]
    : lintTargets;

  results.push(
    overBudget()
      ? skipped("eslint")
      : guard("eslint", () =>
          runNodeTool({
            name: "eslint",
            root,
            pkg: "eslint",
            relBin: "bin/eslint.js",
            args: ["--cache", "--no-warn-ignored", ...eslintTargets],
            // eslint exits 1 for lint problems, 2 for a fatal config error
            findingsExitCodes: [1],
          }),
        ),
  );
}

if (runKnip) {
  results.push(
    overBudget()
      ? skipped("knip")
      : guard("knip", () =>
          runNodeTool({
            name: "knip",
            root,
            pkg: "knip",
            relBin: "bin/knip.js",
            args: ["--cache"],
          }),
        ),
  );
}

finish();
