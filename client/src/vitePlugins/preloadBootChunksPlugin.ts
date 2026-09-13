import type { Plugin } from "vite";

// Vite preloads the entry chunk's static import graph from index.html, but not
// what the entry pulls in with a dynamic import. The root component is loaded
// that way (for the retry-on-stale-chunk wrapper) even though it is needed on
// every load, so without a hint its chunks only start downloading after the
// entry has downloaded, instantiated its vendor dependencies and run - a whole
// round trip behind everything else. Naming those modules here gets them a
// modulepreload link so they download alongside the entry instead.
//
// Only for modules that are always needed. A genuinely deferred import (a view
// behind a route) should keep discovering its chunk at navigation time

const toPosix = (filePath: string): string => filePath.replaceAll("\\", "/");

export const preloadBootChunks = (modulePaths: string[]): Plugin => {
  let base = "/";

  return {
    name: "konsti:preload-boot-chunks",
    apply: "build",

    configResolved: (config) => {
      base = config.base;
    },

    transformIndexHtml: {
      // After Vite has emitted its own preload links, so these are appended
      // rather than interleaved
      order: "post",

      handler: (_html, ctx) => {
        const bundle = ctx.bundle;
        if (!bundle) {
          return;
        }

        const chunks = Object.values(bundle).filter(
          (output) => output.type === "chunk",
        );

        // Everything reachable from the entry through static imports is already
        // preloaded by Vite, so those must not be emitted a second time
        const alreadyPreloaded = new Set<string>();
        const collect = (fileName: string, into: Set<string>): void => {
          if (into.has(fileName)) {
            return;
          }
          // chunk.imports can hold entries that are not chunks in this bundle
          // (an external URL, for one), and those must not become preload
          // links, so only add a name once it resolves to a chunk
          const chunk = chunks.find((output) => output.fileName === fileName);
          if (!chunk) {
            return;
          }
          into.add(fileName);
          for (const imported of chunk.imports) {
            collect(imported, into);
          }
        };

        for (const chunk of chunks) {
          if (chunk.isEntry) {
            collect(chunk.fileName, alreadyPreloaded);
          }
        }

        const toPreload = new Set<string>();
        for (const modulePath of modulePaths) {
          // Leading separator so a path cannot match the tail of an unrelated
          // directory, e.g. other-client/src/app/App.tsx for src/app/App.tsx
          const needle = `/${toPosix(modulePath).replace(/^\//, "")}`;
          const matches = chunks.filter((output) =>
            output.moduleIds.some((id) => toPosix(id).endsWith(needle)),
          );
          if (matches.length !== 1) {
            // Loud rather than silent: a moved or renamed module would
            // otherwise quietly drop the preload, and an ambiguous one would
            // preload whichever chunk happened to come first
            // eslint-disable-next-line no-restricted-syntax -- Fail the build
            throw new Error(
              `preloadBootChunks: expected exactly one chunk containing "${modulePath}", found ${matches.length}`,
            );
          }
          collect(matches[0].fileName, toPreload);
        }

        return [...toPreload]
          .filter((fileName) => !alreadyPreloaded.has(fileName))
          .map((fileName) => ({
            tag: "link",
            attrs: {
              rel: "modulepreload",
              crossorigin: true,
              href: `${base}${fileName}`,
            },
            injectTo: "head" as const,
          }));
      },
    },
  };
};
