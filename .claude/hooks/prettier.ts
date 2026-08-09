import { existingPaths, getGitChanges } from "./gitChanges.ts";
import { getProjectRoot, runNodeTool } from "./nodeTool.ts";

interface HookInput {
  tool_name?: string;
  tool_input?: { file_path?: string };
}

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk as Buffer);
}

let input: HookInput = {};
try {
  input = JSON.parse(Buffer.concat(chunks).toString()) as HookInput;
} catch {
  process.exit(0);
}

const root = getProjectRoot();
const filePath = input.tool_input?.file_path ?? "";

const runPrettier = (paths: string[]): void => {
  if (paths.length === 0) {
    return;
  }
  // Result is deliberately ignored: formatting must never block a turn, and
  // eslint surfaces real syntax problems at Stop
  runNodeTool({
    name: "prettier",
    root,
    pkg: "prettier",
    relBin: "bin/prettier.cjs",
    args: ["--write", "--cache", "--ignore-unknown", ...paths],
  });
};

if (filePath) {
  // Write / Edit / NotebookEdit: format the single file
  runPrettier([filePath]);
} else if (input.tool_name === "Bash") {
  // Bash can modify files outside the hook's visibility (sed -i, redirects,
  // scripts, etc.), so format everything currently uncommitted. Prettier's cache
  // keeps this cheap when nothing changed
  runPrettier(existingPaths(getGitChanges(root)));
}
