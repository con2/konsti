import type { Plugin, Rollup } from "vite";

// An unstamped chunk reads as third-party to the SDK, so its errors are dropped
// with nothing at runtime reporting it. Every non-empty JavaScript chunk has to
// carry the key: the facade chunk the stamper skips takes a second entry point.

const isJsChunk = (fileName: string): boolean => /\.[cm]?js$/u.test(fileName);

export const assertSentryStamp = (keyProperty: string): Plugin => {
  // Quoted on both sides, or this would also match a longer key starting with
  // the same text, which the SDK compares for equality and would reject. Which
  // quote the minifier picks is its own preference, so accept any of the three
  const quotedKey = new RegExp(
    `["'\`]${keyProperty.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`)}["'\`]`,
    "u",
  );

  // The key on its own is not enough: a chunk that merely imported the constant
  // naming it would carry the same string without ever having been stamped
  const isStamped = (code: string): boolean =>
    quotedKey.test(code) && code.includes("_sentryModuleMetadata");

  return {
    name: "konsti:assert-sentry-stamp",
    apply: "build",
    // Orders this plugin's hooks after other plugins', so a chunk one of them
    // rewrites later is still checked. It is not what puts this after the
    // stamping - every renderChunk finishes before any generateBundle
    enforce: "post",

    generateBundle: (_options, bundle) => {
      // Judged on the finished bundle so the names are the ones on disk, and so
      // a chunk another plugin has since emptied, filled or removed is taken as
      // it now stands rather than as it was rendered
      const mustCarryKey = Object.values(bundle)
        .filter(
          (output): output is Rollup.OutputChunk => output.type === "chunk",
        )
        .filter(
          (chunk) => isJsChunk(chunk.fileName) && chunk.code.trim().length > 0,
        );

      const unstamped = mustCarryKey
        .filter((chunk) => !isStamped(chunk.code))
        .map((chunk) => chunk.fileName);

      if (unstamped.length > 0) {
        // eslint-disable-next-line no-restricted-syntax -- Fail the build
        throw new Error(
          `assertSentryStamp: ${unstamped.length} chunk(s) not stamped with "${keyProperty}", so their errors would be discarded as third-party: ${unstamped.join(", ")}`,
        );
      }

      if (mustCarryKey.length === 0) {
        // eslint-disable-next-line no-restricted-syntax -- Fail the build
        throw new Error(
          "assertSentryStamp: no chunk had to carry the application key, so this check verified nothing",
        );
      }
    },
  };
};
