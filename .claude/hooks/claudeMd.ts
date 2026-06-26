import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Stop hook: when a session makes structural changes (files added/renamed/
// deleted, or a package.json edited), remind Claude to review the relevant
// CLAUDE.md before finishing. Pure in-file edits are ignored on purpose —
// CLAUDE.md documents structure, scripts, and conventions, not line-level logic

interface StopHookInput {
  session_id?: string;
  stop_hook_active?: boolean;
}

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) chunks.push(chunk);
let input: StopHookInput = {};
try {
  input = JSON.parse(Buffer.concat(chunks).toString());
} catch {
  process.exit(0);
}

// Loop guard: never block a continuation we already triggered
if (input.stop_hook_active || process.env.KONSTI_SKIP_CLAUDEMD_HOOK) {
  process.exit(0);
}

const isPackageJson = (p: string): boolean => /(^|\/)package\.json$/.test(p);

// Map a changed path to the CLAUDE.md that documents it
const ownerOf = (p: string): string | null => {
  if (/(^|\/)CLAUDE\.md$/.test(p)) return null; // don't nag about the doc itself
  if (p.startsWith(".claude/") || p.startsWith(".history/")) return null;
  if (p.startsWith("client/")) return "client/CLAUDE.md";
  if (p.startsWith("server/")) return "server/CLAUDE.md";
  if (p.startsWith("shared/")) return "shared/CLAUDE.md";
  if (p.startsWith("playwright/")) return "playwright/CLAUDE.md";
  return "CLAUDE.md"; // root: top-level files and new directories
};

// Structural = a file appearing / disappearing / moving, or a package.json edit
const isStructural = (code: string, p: string): boolean =>
  /[ADRC]/.test(code) || code === "??" || isPackageJson(p);

interface Change {
  area: string;
  path: string;
  kind: string;
}

let raw = "";
try {
  raw = execFileSync("git", ["status", "--porcelain", "-z"], {
    encoding: "utf8",
  });
} catch {
  process.exit(0);
}

const segs = raw.split("\0").filter(Boolean);
const changes: Change[] = [];
for (let i = 0; i < segs.length; i++) {
  const code = segs[i].slice(0, 2);
  const filePath = segs[i].slice(3);
  // Rename/copy porcelain entries are "XY <new>\0<old>" — skip the trailing old path
  if (code.startsWith("R") || code.startsWith("C")) i++;
  if (!isStructural(code, filePath)) continue;
  const area = ownerOf(filePath);
  if (!area) continue;
  const kind =
    code === "??"
      ? "added"
      : code.includes("D")
        ? "deleted"
        : code.includes("R")
          ? "renamed"
          : isPackageJson(filePath)
            ? "scripts/deps changed"
            : "added";
  changes.push({ area, path: filePath, kind });
}

if (changes.length === 0) process.exit(0);

// Per-session de-dupe: remind at most once per owning CLAUDE.md per session
const stateDir = path.join(tmpdir(), "konsti-claudemd-hook");
const stateFile = path.join(
  stateDir,
  `${input.session_id ?? "nosession"}.json`,
);
let nudged = new Set<string>();
try {
  nudged = new Set(JSON.parse(readFileSync(stateFile, "utf8")) as string[]);
} catch {
  // No prior state this session
}
const freshAreas = [...new Set(changes.map((c) => c.area))].filter(
  (a) => !nudged.has(a),
);
if (freshAreas.length === 0) process.exit(0);

try {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify([...nudged, ...freshAreas]));
} catch {
  // If state can't persist, the stop_hook_active guard still prevents loops
}

const lines = freshAreas.map((area) => {
  const items = changes
    .filter((c) => c.area === area)
    .map((c) => `${c.kind}: ${c.path}`)
    .slice(0, 8);
  return `- ${area} — ${items.join("; ")}`;
});

const reason =
  "Documentation check before finishing. This session made structural changes that " +
  "these CLAUDE.md files may need to reflect:\n" +
  lines.join("\n") +
  "\n\nReview the listed CLAUDE.md file(s). If any documented directory structure, " +
  "available scripts/commands, key files, or conventions are now inaccurate or incomplete, " +
  "update them concisely. If the docs are already accurate, make no changes and finish. " +
  "Do not document transient implementation detail or rewrite for style.";

process.stdout.write(JSON.stringify({ decision: "block", reason }));
process.exit(0);
