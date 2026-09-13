import { afterEach, describe, expect, test } from "vitest";
import { config } from "shared/config";
import { sentryApplicationKeyPrefix } from "shared/config/sentryConfig";
import { isBundleStamped } from "client/utils/injectedScriptFilter";

const metadataGlobal = globalThis as typeof globalThis & {
  _sentryModuleMetadata?: Record<string, Record<string, unknown>>;
};

const appKeyProperty = `${sentryApplicationKeyPrefix}${config.sentry().applicationKey}`;

// The build keys the store by the stack it captured at chunk load, which nothing
// reads here - only the value it points at decides the answer
const chunkStack =
  "Error\n    at https://ropekonsti.fi/assets/App-gisvOVt2.js:1:1";

describe("isBundleStamped", () => {
  afterEach(() => {
    delete metadataGlobal._sentryModuleMetadata;
  });

  test("should report a bundle whose chunks registered the application key", () => {
    metadataGlobal._sentryModuleMetadata = {
      [chunkStack]: { [appKeyProperty]: true },
    };

    expect(isBundleStamped()).toBe(true);
  });

  // What a dev-server session looks like: renderChunk never runs, so no chunk
  // ever registers anything
  test("should report an unstamped bundle when nothing registered metadata", () => {
    expect(isBundleStamped()).toBe(false);
  });

  test("should report an unstamped bundle for an empty metadata store", () => {
    metadataGlobal._sentryModuleMetadata = {};

    expect(isBundleStamped()).toBe(false);
  });

  // A dependency stamped with someone else's key would otherwise switch the
  // filter on over chunks of ours carrying none, which discards every error
  test("should not count another application's key as this bundle's stamp", () => {
    metadataGlobal._sentryModuleMetadata = {
      [chunkStack]: { [`${sentryApplicationKeyPrefix}not-konsti`]: true },
    };

    expect(isBundleStamped()).toBe(false);
  });
});
