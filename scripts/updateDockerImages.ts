import { execFileSync } from "node:child_process";
import fs from "node:fs";

// Rewrites every tagged image reference on an ARG or FROM line of the files
// below to tag@digest, resolving the tag's current digest from the registry.
// The digest is the multi-arch index digest, so FROM still picks the platform.
// Run after a base image tag has been republished to pick up the new build.

const files = ["Dockerfile"];

// Group 1: the line prefix, group 2: the tagged reference, group 3: an existing digest
const imageReference =
  /^(ARG \w+=|FROM )([\w./-]+:[\w.-]+)(@sha256:[0-9a-f]{64})?/u;

const resolveDigest = (reference: string): string => {
  return execFileSync(
    "docker",
    [
      "buildx",
      "imagetools",
      "inspect",
      reference,
      "--format",
      "{{json .Manifest.Digest}}",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  )
    .trim()
    .replaceAll('"', "");
};

const digests = new Map<string, string>();

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const updated = original
    .split("\n")
    .map((line) => {
      const match = imageReference.exec(line);
      if (!match) {
        return line;
      }
      const [matched, prefix, reference] = match;
      // at() keeps the optional group typed as possibly undefined
      const currentDigest = match.at(3);
      let digest = digests.get(reference);
      if (!digest) {
        digest = resolveDigest(reference);
        digests.set(reference, digest);
      }
      if (currentDigest === `@${digest}`) {
        console.log(`unchanged ${reference}`);
        return line;
      }
      console.log(
        `updated ${reference}: ${currentDigest?.slice(1) ?? "no digest"} -> ${digest}`,
      );
      return `${prefix}${reference}@${digest}${line.slice(matched.length)}`;
    })
    .join("\n");

  if (updated !== original) {
    fs.writeFileSync(file, updated);
  }
}
