// @vitest-environment node
import type { Rollup } from "vite";
import { describe, expect, test } from "vitest";
import { assertSentryStamp } from "./assertSentryStampPlugin";

// The plugin takes the key to look for, so these exercise its logic rather than
// the project's own key
const keyProperty = "app-key-under-test";

interface FakeChunk {
  name?: string;
  code?: string;
  facadeModuleId?: string | null;
}

// A chunk carries far more than the plugin reads, so these stand-ins are cast in
// rather than built out in full
const bundled = (
  fileName: string,
  { name, code, facadeModuleId = null }: FakeChunk = {},
): unknown => ({
  type: "chunk",
  fileName,
  name: name ?? fileName,
  facadeModuleId,
  // Minified, where the injected `true` has become `!0`. The metadata global
  // belongs here too: the key on its own does not mean a chunk was stamped
  code:
    code ??
    `e._sentryModuleMetadata[n]={${JSON.stringify(keyProperty)}:!0};console.log(1)`,
});

// Drives the hook a build would, returning the error if one is thrown
const runBuild = (bundle: Record<string, unknown>): Error | undefined => {
  const { generateBundle } = assertSentryStamp(keyProperty);
  if (typeof generateBundle !== "function") {
    // eslint-disable-next-line no-restricted-syntax -- Guards the casts below
    throw new TypeError("Expected the plugin to define generateBundle");
  }

  try {
    void generateBundle.call(
      undefined as never,
      {} as Rollup.NormalizedOutputOptions,
      bundle as unknown as Rollup.OutputBundle,
      false,
    );
    return undefined;
  } catch (error) {
    return error as Error;
  }
};

describe("assertSentryStamp", () => {
  test("should pass when every chunk carries the application key", () => {
    expect(
      runBuild({
        "assets/index.js": bundled("assets/index.js"),
        "assets/App.js": bundled("assets/App.js"),
      }),
    ).toBeUndefined();
  });

  test("should fail the build naming every chunk that lacks the key", () => {
    const error = runBuild({
      "assets/index.js": bundled("assets/index.js"),
      "assets/App.js": bundled("assets/App.js", { code: "console.log(2)" }),
      "assets/vendor.js": bundled("assets/vendor.js", {
        code: "console.log(3)",
      }),
    });

    expect(error?.message).toContain("assets/App.js, assets/vendor.js");
  });

  // The name a chunk carries is shared and hashless, so the report has to reach
  // for the file someone can go and look at instead
  test("should name chunks by their file name, not their chunk name", () => {
    const error = runBuild({
      "assets/App-CNN3KnOg.js": bundled("assets/App-CNN3KnOg.js", {
        name: "App",
        code: "console.log(2)",
      }),
    });

    expect(error?.message).toContain("assets/App-CNN3KnOg.js");
  });

  test("should not name a chunk that does carry the key", () => {
    const error = runBuild({
      "assets/index.js": bundled("assets/index.js"),
      "assets/App.js": bundled("assets/App.js", { code: "console.log(2)" }),
    });

    // Asserts on a message that exists, so a plugin that stopped throwing fails
    // this rather than passing it vacuously
    expect(error).toBeDefined();
    expect(error?.message).not.toContain("assets/index.js");
  });

  // The SDK slices the prefix off and compares the rest for equality, so a key
  // that merely starts with the configured one must not satisfy the check
  test("should fail on a stamped key that only starts with the configured one", () => {
    const error = runBuild({
      "assets/index.js": bundled("assets/index.js", {
        code: `e._sentryModuleMetadata[n]={${JSON.stringify(`${keyProperty}-extra`)}:!0}`,
      }),
    });

    expect(error?.message).toContain("assets/index.js");
  });

  // The Sentry plugin skips these itself, so requiring a stamp would fail a
  // build nobody could fix
  test("should ignore an empty chunk, which the Sentry plugin does not stamp", () => {
    expect(
      runBuild({
        "assets/index.js": bundled("assets/index.js"),
        "assets/lazy.js": bundled("assets/lazy.js", { code: "\n  \n" }),
      }),
    ).toBeUndefined();
  });

  // The one chunk the stamper skips that this app cannot produce, wanting a
  // second entry point. Failing on it is the trade for predicting no skips: a
  // build that grew one says so, rather than being excused unseen
  test("should require the key from a chunk that only re-exports", () => {
    const error = runBuild({
      "assets/index.js": bundled("assets/index.js"),
      "assets/facade.js": bundled("assets/facade.js", {
        code: 'import"./index.js";',
        facadeModuleId: "/repo/client/index.html",
      }),
    });

    expect(error?.message).toContain("assets/facade.js");
  });

  // Which quote a minifier puts around a property name is its own preference, so
  // the check must not rest on one
  test("should accept a stamp the minifier quoted differently", () => {
    expect(
      runBuild({
        "assets/index.js": bundled("assets/index.js", {
          code: `e._sentryModuleMetadata[n]={'${keyProperty}':!0};console.log(1)`,
        }),
      }),
    ).toBeUndefined();
  });

  // A chunk that imported the constant naming the key would carry the string
  // without the Sentry plugin ever having stamped it
  test("should not count the key on its own as a stamp", () => {
    const error = runBuild({
      "assets/index.js": bundled("assets/index.js"),
      "assets/App.js": bundled("assets/App.js", {
        code: `const key=${JSON.stringify(keyProperty)};console.log(key)`,
      }),
    });

    expect(error?.message).toContain("assets/App.js");
  });

  test("should ignore a chunk that is not JavaScript", () => {
    expect(
      runBuild({
        "assets/index.js": bundled("assets/index.js"),
        "assets/worker.wasm": bundled("assets/worker.wasm", {
          code: "not javascript",
        }),
      }),
    ).toBeUndefined();
  });

  // Passing here would mean the check silently stopped guarding anything, which
  // is the exact silence it exists to break
  test("should fail when no chunk had to carry the key", () => {
    const error = runBuild({
      "assets/logo.svg": { type: "asset", source: "<svg />" },
    });

    expect(error?.message).toContain("verified nothing");
  });
});
