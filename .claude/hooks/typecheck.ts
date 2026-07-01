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

const isTypeScript = (p: string): boolean =>
  p.endsWith(".ts") || p.endsWith(".tsx");

const anyUncommittedTsChanges = (): boolean => {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "-z"], {
      encoding: "utf8",
    });
    return out
      .split("\0")
      .filter(Boolean)
      .map((entry) => entry.slice(3))
      .some(isTypeScript);
  } catch {
    return false;
  }
};

// filePath set (Write/Edit): check that file. Otherwise (Stop hook or Bash):
// run if any uncommitted change touches TypeScript
const shouldRun = filePath ? isTypeScript(filePath) : anyUncommittedTsChanges();

if (!shouldRun) {
  process.exit(0);
}

try {
  // Route tsc output to our stderr (fd 2) so Claude Code surfaces type errors
  // as the block reason (exit 2 only shows stderr)
  runYarn(["type-check"], ["ignore", 2, 2]);
} catch {
  process.exit(2);
}
