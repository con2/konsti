import { readFileSync } from "node:fs";
import path from "node:path";

interface TranscriptToolUse {
  type?: string;
  name?: string;
  input?: { file_path?: string; notebook_path?: string };
}

interface TranscriptEntry {
  message?: { content?: TranscriptToolUse[] | string };
}

// Tools that edit files and report the target path in their input
const editTools = new Set(["Write", "Edit", "NotebookEdit"]);

// Case-insensitive comparison keeps Windows paths matching; merging paths
// differing only by case elsewhere is harmless for deciding whether to run
export const normalizePath = (p: string): string =>
  path.resolve(p).toLowerCase();

// Collect absolute paths of files edited with file-editing tools during the
// session. Returns null when the transcript is missing or unreadable so
// callers can fall back to checking the whole working tree
export const getSessionEditedFiles = (
  transcriptPath: string | undefined,
): Set<string> | null => {
  if (!transcriptPath) {
    return null;
  }
  let raw: string;
  try {
    raw = readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }
  const files = new Set<string>();
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
  return files;
};
