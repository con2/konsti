import { execFileSync } from "node:child_process";
import { runYarn } from "./runYarn";

interface HookInput {
  tool_name?: string;
  tool_input?: { file_path?: string };
  tool_response?: { filePath?: string };
}

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

const input: HookInput = JSON.parse(Buffer.concat(chunks).toString());
const filePath =
  input.tool_input?.file_path || input.tool_response?.filePath || "";

const isLintable = (p: string): boolean =>
  p.endsWith(".ts") ||
  p.endsWith(".tsx") ||
  p.endsWith(".js") ||
  p.endsWith(".jsx");

const getUncommittedFiles = (): string[] => {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "-z"], {
      encoding: "utf8",
    });
    return out
      .split("\0")
      .filter(Boolean)
      .map((entry) => entry.slice(3))
      .filter(Boolean);
  } catch {
    return [];
  }
};

let targets: string[];
if (filePath) {
  targets = isLintable(filePath) ? [filePath] : [];
} else {
  // Stop hook (or Bash): no single file to target, so lint every lintable
  // file that's currently uncommitted in the working tree
  targets = getUncommittedFiles().filter(isLintable);
}

if (targets.length === 0) {
  process.exit(0);
}

try {
  // Route eslint's stdout to our stderr (fd 2) so Claude Code's hook runner
  // surfaces lint findings as the block reason (exit 2 only shows stderr)
  runYarn(
    ["run", "-TB", "eslint", "--cache", "--no-warn-ignored", ...targets],
    ["ignore", 2, 2],
  );
} catch {
  process.exit(2);
}
