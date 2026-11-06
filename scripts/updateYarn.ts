import { execFileSync } from "node:child_process";
import fs from "node:fs";

const run = (args: string[]): void => {
  execFileSync(process.execPath, args, { stdio: "inherit" });
};

const readYarnPath = (): string | undefined => {
  return /^yarnPath: (.+)$/m
    .exec(fs.readFileSync(".yarnrc.yml", "utf8"))
    ?.at(1)
    ?.trim();
};

const current = readYarnPath();
if (current === undefined) {
  console.error("No yarnPath in .yarnrc.yml");
  process.exitCode = 1;
} else {
  run([current, "set", "version", "stable"]);
  const updated = readYarnPath() ?? current;
  // A new release can rehash its built-in patches, which CI's immutable
  // install rejects. Run through the new release: the one that started this
  // script has just been deleted.
  run([updated, "install"]);
}
