// @vitest-environment node
import type { HtmlTagDescriptor, IndexHtmlTransformContext } from "vite";
import { describe, expect, test } from "vitest";
import { preloadBootChunks } from "./preloadBootChunksPlugin";

const appModuleId = "client/src/app/App.tsx";

interface FakeChunk {
  isEntry?: boolean;
  imports?: string[];
  moduleIds?: string[];
}

const chunk = (
  fileName: string,
  { isEntry = false, imports = [], moduleIds = [] }: FakeChunk = {},
): unknown => ({ type: "chunk", fileName, isEntry, imports, moduleIds });

// The real bundle carries far more per chunk than the plugin reads, so these
// stand-ins are cast in rather than built out in full
const runPlugin = (
  bundle: Record<string, unknown> | undefined,
  modulePaths: string[] = [appModuleId],
): (string | boolean | undefined)[] => {
  const transform = preloadBootChunks(modulePaths).transformIndexHtml;
  if (typeof transform !== "object") {
    // eslint-disable-next-line no-restricted-syntax -- Guards the cast below
    throw new TypeError("Expected the object form of transformIndexHtml");
  }

  const context = { bundle } as unknown as IndexHtmlTransformContext;
  const tags = transform.handler.call(
    // The handler reads nothing off `this`
    undefined as never,
    "",
    context,
  ) as HtmlTagDescriptor[] | undefined;

  return (tags ?? []).map((tag) => tag.attrs?.href);
};

describe("preloadBootChunks", () => {
  test("preloads the named module's chunk and its static imports", () => {
    const hrefs = runPlugin({
      "assets/index.js": chunk("assets/index.js", {
        isEntry: true,
        imports: ["assets/vendor.js"],
      }),
      "assets/vendor.js": chunk("assets/vendor.js"),
      "assets/App.js": chunk("assets/App.js", {
        imports: ["assets/AppRoutes.js"],
        moduleIds: ["/repo/client/src/app/App.tsx"],
      }),
      "assets/AppRoutes.js": chunk("assets/AppRoutes.js"),
    });

    // AppRoutes comes along without being named, because the root component
    // cannot render without it
    expect(hrefs).toEqual(["/assets/App.js", "/assets/AppRoutes.js"]);
  });

  test("skips chunks Vite already preloads from the entry's static graph", () => {
    const hrefs = runPlugin({
      "assets/index.js": chunk("assets/index.js", {
        isEntry: true,
        imports: ["assets/vendor.js"],
      }),
      // Reachable from the entry, so it already has a preload link
      "assets/vendor.js": chunk("assets/vendor.js"),
      "assets/App.js": chunk("assets/App.js", {
        imports: ["assets/vendor.js"],
        moduleIds: ["/repo/client/src/app/App.tsx"],
      }),
    });

    expect(hrefs).toEqual(["/assets/App.js"]);
  });

  test("matches module ids written with either path separator", () => {
    // Module ids are OS paths: backslashes on Windows, forward slashes in CI
    const windowsBundle = {
      "assets/index.js": chunk("assets/index.js", { isEntry: true }),
      "assets/App.js": chunk("assets/App.js", {
        moduleIds: [String.raw`C:\repo\client\src\app\App.tsx`],
      }),
    };

    expect(runPlugin(windowsBundle)).toEqual(["/assets/App.js"]);
    expect(
      runPlugin(windowsBundle, [String.raw`client\src\app\App.tsx`]),
    ).toEqual(["/assets/App.js"]);
  });

  test("fails the build when no chunk contains the module", () => {
    expect(() =>
      runPlugin({
        "assets/index.js": chunk("assets/index.js", { isEntry: true }),
      }),
    ).toThrow(appModuleId);
  });

  test("does nothing without a bundle", () => {
    expect(runPlugin(undefined)).toEqual([]);
  });
});
