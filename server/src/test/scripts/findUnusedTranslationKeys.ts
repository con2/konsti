import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { translationEN } from "client/locales/en";

const REPO_ROOT = fileURLToPath(new URL("../../../..", import.meta.url));

const CLIENT_SRC = path.join(REPO_ROOT, "client/src");

const SKIP_DIRS = new Set(["node_modules", "locales"]);

const flattenKeys = (obj: Record<string, unknown>, prefix = ""): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
};

const walk = (dir: string, files: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) files.push(full);
  }
  return files;
};

const STRING_LITERAL_RE = /["'`]([^"'`\n\r${}]+)["'`]/g;
const TEMPLATE_LITERAL_RE = /`([^`]*\$\{[^}]+\}[^`]*)`/g;

const allKeys = flattenKeys(translationEN);
const allKeysSet = new Set(allKeys);
const usedKeys = new Set<string>();
const dynamicSkeletons = new Set<string>();

const sourceFiles = walk(CLIENT_SRC);

for (const file of sourceFiles) {
  if (file.endsWith("i18n.ts") || file.endsWith("i18next.d.ts")) continue;

  const text = readFileSync(file, "utf8");

  for (const match of text.matchAll(STRING_LITERAL_RE)) {
    if (allKeysSet.has(match[1])) usedKeys.add(match[1]);
  }

  for (const match of text.matchAll(TEMPLATE_LITERAL_RE)) {
    const template = match[1];
    if (!/^[a-zA-Z]/.test(template)) continue;
    const skeleton = template.replaceAll(/\$\{[^}]+\}/g, "*");
    if (!/^[a-zA-Z0-9_.*+-]+$/.test(skeleton)) continue;
    if (!skeleton.includes(".")) continue;
    dynamicSkeletons.add(skeleton);
  }
}

const dynamicMatchers = [...dynamicSkeletons].map((skeleton) => {
  const pattern = skeleton
    .replaceAll(/[.+-]/g, (c) => `\\${c}`)
    .replaceAll("*", "[^.]+");
  return new RegExp(`^${pattern}$`);
});

const isDynamicallyUsed = (key: string): boolean =>
  dynamicMatchers.some((re) => re.test(key));

const unused = allKeys.filter(
  (key) => !usedKeys.has(key) && !isDynamicallyUsed(key),
);

if (unused.length === 0) {
  process.stdout.write(
    `No unused translation keys (${allKeys.length} total)\n`,
  );
} else {
  process.stdout.write(
    `Unused translation keys (${unused.length}/${allKeys.length}):\n`,
  );
  for (const key of unused) process.stdout.write(`  ${key}\n`);
  // eslint-disable-next-line unicorn/no-process-exit -- CLI script
  process.exit(1);
}
