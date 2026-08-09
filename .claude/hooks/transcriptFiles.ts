import { readFileSync, statSync } from "node:fs";
import path from "node:path";

interface TranscriptToolUse {
  type?: string;
  name?: string;
  input?: { file_path?: string; notebook_path?: string };
}

interface TranscriptEntry {
  timestamp?: string;
  message?: { content?: TranscriptToolUse[] | string };
}

// Tools that edit files and report the target path in their input
const editTools = new Set(["Write", "Edit", "NotebookEdit"]);

// Case-insensitive comparison keeps Windows paths matching; merging paths
// differing only by case elsewhere is harmless for deciding whether to run
export const normalizePath = (p: string): string =>
  path.resolve(p).toLowerCase();

interface ParsedTranscript {
  files: Set<string>;
  startedAt: number | null;
}

const parseTranscript = (transcriptPath: string): ParsedTranscript | null => {
  let raw: string;
  try {
    raw = readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }

  const files = new Set<string>();
  let startedAt: number | null = null;

  for (const line of raw.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    let entry: TranscriptEntry;
    try {
      entry = JSON.parse(line) as TranscriptEntry;
    } catch {
      continue;
    }
    if (startedAt === null && entry.timestamp) {
      const parsed = Date.parse(entry.timestamp);
      if (!Number.isNaN(parsed)) {
        startedAt = parsed;
      }
    }
    const content = entry.message?.content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const item of content) {
      if (item.type !== "tool_use" || !editTools.has(item.name ?? "")) {
        continue;
      }
      const filePath = item.input?.file_path ?? item.input?.notebook_path;
      if (typeof filePath === "string" && filePath) {
        files.add(normalizePath(filePath));
      }
    }
  }
  return { files, startedAt };
};

const modifiedSince = (target: string, since: number): boolean => {
  const stat = statSync(target, { throwIfNoEntry: false });
  if (stat) {
    return stat.mtimeMs >= since;
  }
  // The path is gone, so its own mtime can't answer. Removing an entry updates
  // the parent directory, which carries the same evidence for a deletion
  const parent = statSync(path.dirname(target), { throwIfNoEntry: false });
  return parent !== undefined && parent.mtimeMs >= since;
};

export interface SessionScope {
  // False when the transcript is missing or unreadable, meaning callers must not
  // filter at all and should check the whole working tree
  known: boolean;
  // Did this session touch the given repo-relative path?
  touched: (relPath: string) => boolean;
}

// Decide which of the working tree's changes belong to this session, so a file
// the user already had dirty before the session started doesn't trigger checks
// on its own.
//
// The transcript only records paths for Write/Edit/NotebookEdit, so edits made
// through Bash (sed -i, a codegen script, rm, git checkout) are invisible to it.
// Modification time closes that gap: anything changed at or after the session's
// first transcript entry was touched during the session, whatever tool did it.
// For a path that no longer exists, its parent directory's mtime carries the
// same evidence, since removing an entry updates the directory.
export const getSessionScope = (
  transcriptPath: string | undefined,
  root: string,
): SessionScope => {
  const parsed = transcriptPath ? parseTranscript(transcriptPath) : null;
  if (!parsed) {
    return { known: false, touched: () => true };
  }

  const { files, startedAt } = parsed;
  return {
    known: true,
    touched: (relPath: string): boolean => {
      const absolute = path.resolve(root, relPath);
      if (files.has(normalizePath(absolute))) {
        return true;
      }
      if (startedAt === null) {
        return false;
      }
      return modifiedSince(absolute, startedAt);
    },
  };
};
