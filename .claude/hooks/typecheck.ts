import { runYarn } from "./runYarn";

interface HookInput {
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

if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) {
  process.exit(0);
}

try {
  // Route tsc output to our stderr (fd 2) so Claude Code surfaces type errors
  // as the block reason (exit 2 only shows stderr)
  runYarn(["type-check"], ["ignore", 2, 2]);
} catch {
  process.exit(2);
}
