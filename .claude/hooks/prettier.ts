import { execFileSync } from "node:child_process";

interface HookInput {
  tool_input?: { file_path?: string };
}

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

const input: HookInput = JSON.parse(Buffer.concat(chunks).toString());
const filePath = input.tool_input?.file_path || "";

if (filePath) {
  execFileSync("yarn", ["prettier", "--write", filePath], {
    stdio: "inherit",
  });
}
