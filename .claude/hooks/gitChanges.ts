import { execFileSync } from "node:child_process";

export interface GitChange {
  code: string;
  path: string;
  // Rename/copy entries carry the path the file moved from
  oldPath?: string;
  deleted: boolean;
}

// Single parser for `git status --porcelain -z`, shared by every hook so rename
// and deletion handling can't drift between them
export const getGitChanges = (root: string): GitChange[] => {
  let raw: string;
  try {
    raw = execFileSync("git", ["status", "--porcelain", "-z"], {
      encoding: "utf8",
      cwd: root,
    });
  } catch {
    return [];
  }

  const tokens = raw.split("\0").filter(Boolean);
  const changes: GitChange[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const code = tokens[i].slice(0, 2);
    const filePath = tokens[i].slice(3);
    // A rename/copy entry is "XY <new>\0<old>": the original path follows as its
    // own token with no status prefix, so consume it here rather than letting a
    // later iteration misread it as a file
    let oldPath: string | undefined;
    if (/[RC]/.test(code)) {
      i += 1;
      oldPath = tokens[i];
    }
    if (!filePath) {
      continue;
    }
    changes.push({
      code,
      path: filePath,
      oldPath,
      deleted: code.includes("D"),
    });
  }
  return changes;
};

// Every path a change touches, including deletions and the source side of a
// rename. Drives the type-check/knip gates and tsc project selection: removing
// or moving a file can break its importers even though the file is gone
export const allPaths = (changes: GitChange[]): string[] =>
  changes.flatMap((c) => (c.oldPath ? [c.path, c.oldPath] : [c.path]));

// Paths that still exist on disk, so they can be passed to a linter or formatter
export const existingPaths = (changes: GitChange[]): string[] =>
  changes.filter((c) => !c.deleted).map((c) => c.path);
