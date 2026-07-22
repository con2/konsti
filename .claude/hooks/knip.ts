import { execFileSync } from "node:child_process";
import { runYarn } from "./runYarn";
import { getSessionEditedFiles } from "./transcriptFiles";

interface HookInput {
  tool_name?: string;
  transcript_path?: string;
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

const isCodeFile = (p: string): boolean =>
  p.endsWith(".ts") ||
  p.endsWith(".tsx") ||
  p.endsWith(".js") ||
  p.endsWith(".jsx");

const anyUncommittedCodeChanges = (): boolean => {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "-z"], {
      encoding: "utf8",
    });
    return out
      .split("\0")
      .filter(Boolean)
      .map((entry) => entry.slice(3))
      .some(isCodeFile);
  } catch {
    return false;
  }
};

// Did this session's file edits touch code? Unknown transcript means assume
// yes so the check still runs
const sessionTouchedCode = (): boolean => {
  const edited = getSessionEditedFiles(input.transcript_path);
  if (!edited) {
    return true;
  }
  return [...edited].some(isCodeFile);
};

// filePath set (Write/Edit): check that file. Otherwise (Stop hook or Bash):
// run if any uncommitted change touches code and this session edited code,
// so pre-existing working-tree changes don't trigger a run on their own
const shouldRun = filePath
  ? isCodeFile(filePath)
  : anyUncommittedCodeChanges() && sessionTouchedCode();

if (!shouldRun) {
  process.exit(0);
}

try {
  // Route knip output to our stderr (fd 2) so Claude Code surfaces findings
  // as the block reason (exit 2 only shows stderr)
  runYarn(["knip"], ["ignore", 2, 2]);
} catch {
  process.exit(2);
}
