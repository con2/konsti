import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Rewrites every tagged image reference in the Dockerfile (ARG and FROM lines)
// and in the workflows and local actions (uses: docker:// lines) to tag@digest,
// resolving the tag's current digest from the registry. The digest is the
// multi-arch index digest, so the platform is still picked at pull time.

const yamlFilesIn = (dir: string): string[] => {
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(".yml"))
    .map((name) => path.join(dir, name));
};

const files = [
  "Dockerfile",
  ...yamlFilesIn(path.join(".github", "workflows")),
  ...yamlFilesIn(path.join(".github", "actions")),
];

// Group 1: the line prefix, group 2: the tagged reference, group 3: an existing
// digest. The name needs a letter and the reference must end at a digest,
// whitespace or the line end, so an ARG value like 5000:5000 is not taken for
// an image. Registry ports and FROM --platform are not supported.
const imageReference =
  /^(ARG \w+=|FROM |\s+(?:- )?uses: docker:\/\/)((?=[\w./-]*[a-z])[\w./-]+:[\w.-]+)(@sha256:[0-9a-f]{64})?(?=\s|$)/u;

const resolveDigest = (reference: string): string => {
  return execFileSync(
    "docker",
    [
      "buildx",
      "imagetools",
      "inspect",
      reference,
      "--format",
      "{{.Manifest.Digest}}",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  ).trim();
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
