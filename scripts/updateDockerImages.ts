import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Rewrites every tagged image reference in the Dockerfile (ARG and FROM lines)
// and in the workflows and local actions (uses: docker:// lines) to tag@digest,
// resolving the tag's current digest from the registry. The digest is the
// multi-arch index digest, so the platform is still picked at pull time. The
// "# Built <date> on Alpine <release>" line above each reference is written
// here as well, so a digest can be read as a date and a base OS release.

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

const contextLine = /^\s*# Built \d{4}-\d{2}-\d{2}( on Alpine \S+)?$/u;

const docker = (args: string[], stderr: "inherit" | "ignore"): string => {
  return execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", stderr],
  }).trim();
};

const resolveDigest = (reference: string): string => {
  return docker(
    [
      "buildx",
      "imagetools",
      "inspect",
      reference,
      "--format",
      "{{.Manifest.Digest}}",
    ],
    "inherit",
  );
};

// The image config is keyed by platform for a multi-arch image and is a single
// object otherwise; the platforms are built together, so any created date will do
const resolveCreated = (pinned: string): string | undefined => {
  const parsed: unknown = JSON.parse(
    docker(
      [
        "buildx",
        "imagetools",
        "inspect",
        pinned,
        "--format",
        "{{json .Image}}",
      ],
      "inherit",
    ),
  );
  if (parsed === null || typeof parsed !== "object") {
    return undefined;
  }
  const configs = parsed as Record<string, unknown>;
  const config =
    "created" in configs
      ? configs
      : (configs["linux/amd64"] ?? Object.values(configs)[0]);
  const created =
    config !== null && typeof config === "object" && "created" in config
      ? config.created
      : undefined;
  return typeof created === "string" ? created.slice(0, 10) : undefined;
};

// Runs the image, which pulls it for the host platform. An image without the
// Alpine release file gets no release in its context line
const resolveAlpineRelease = (pinned: string): string | undefined => {
  try {
    return docker(
      ["run", "--rm", "--entrypoint", "cat", pinned, "/etc/alpine-release"],
      "ignore",
    );
  } catch {
    return undefined;
  }
};

interface Pin {
  digest: string;
  // Undefined when the registry gave no created date; the line is then left as is
  context: string | undefined;
}

const pins = new Map<string, Pin>();

const describe = (reference: string): Pin => {
  let pin = pins.get(reference);
  if (!pin) {
    const digest = resolveDigest(reference);
    const pinned = `${reference}@${digest}`;
    const created = resolveCreated(pinned);
    if (created === undefined) {
      console.error(`No created date in the image config for ${pinned}`);
      process.exitCode = 1;
    }
    const alpine = resolveAlpineRelease(pinned);
    const context =
      created === undefined
        ? undefined
        : `# Built ${created}${alpine ? ` on Alpine ${alpine}` : ""}`;
    pin = { digest, context };
    pins.set(reference, pin);
  }
  return pin;
};

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const output: string[] = [];

  for (const line of original.split("\n")) {
    const match = imageReference.exec(line);
    if (!match) {
      output.push(line);
      continue;
    }
    const [matched, prefix, reference] = match;
    // at() keeps the optional group typed as possibly undefined
    const currentDigest = match.at(3);
    const { digest, context } = describe(reference);
    const indent = /^\s*/u.exec(line)?.[0] ?? "";

    // The context line is regenerated, so a stale one above is replaced
    if (context !== undefined) {
      const previous = output.at(-1);
      if (previous !== undefined && contextLine.test(previous)) {
        output.pop();
      }
      output.push(`${indent}${context}`);
    }

    const summary = context?.slice("# ".length) ?? "no build date";
    if (currentDigest === `@${digest}`) {
      console.log(`unchanged ${reference} (${summary})`);
      output.push(line);
      continue;
    }
    console.log(
      `updated ${reference}: ${currentDigest?.slice(1) ?? "no digest"} -> ${digest} (${summary})`,
    );
    output.push(`${prefix}${reference}@${digest}${line.slice(matched.length)}`);
  }

  const updated = output.join("\n");
  if (updated !== original) {
    fs.writeFileSync(file, updated);
  }
}
