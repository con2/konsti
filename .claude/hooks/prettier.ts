import { execFileSync } from "node:child_process";
import { runYarn } from "./runYarn";

interface HookInput {
  tool_name?: string;
  tool_input?: { file_path?: string };
}

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

const input: HookInput = JSON.parse(Buffer.concat(chunks).toString());
const filePath = input.tool_input?.file_path ?? "";

const runPrettier = (paths: string[]): void => {
  if (paths.length === 0) return;
  try {
    runYarn(["prettier", "--write", "--ignore-unknown", ...paths]);
  } catch {
    // Don't block — eslint surfaces real syntax/style issues
  }
};

if (filePath) {
  // Write / Edit / NotebookEdit: format the single file
  runPrettier([filePath]);
} else if (input.tool_name === "Bash") {
  // Bash can modify files outside the hook's visibility (sed -i, redirects,
  // scripts, etc.), so format everything currently uncommitted in the working
  // tree. Prettier's cache keeps this cheap when nothing changed
  try {
    const out = execFileSync("git", ["status", "--porcelain", "-z"], {
      encoding: "utf8",
    });
    const paths = out
      .split("\0")
      .filter(Boolean)
      // porcelain entries are "XY <path>"; strip the 3-char status prefix
      .map((entry) => entry.slice(3))
      .filter(Boolean);
    runPrettier(paths);
  } catch {
    // Not a git repo or git unavailable — nothing we can do
  }
}
