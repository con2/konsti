import { execFileSync } from "node:child_process";

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
  execFileSync("yarn", ["type-check"], { stdio: "inherit" });
} catch {
  // Don't block on type errors
}
