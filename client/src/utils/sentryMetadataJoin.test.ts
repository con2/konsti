import type { ErrorEvent, StackFrame } from "@sentry/react";
import { captureEvent, close, flush } from "@sentry/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { sentryApplicationKeyProperty } from "shared/config/sentryConfig";
import {
  errorEvent,
  initWithInjectedScriptFilter,
} from "client/test/sentryFilterHelpers";

// Kept in its own file because the SDK caches the stacks it has parsed, and the
// filenames it resolved them to, at module scope and never evicts either: seeding
// that global leaves every later test in the same file seeing the result
const stampedChunkUrl = "https://ropekonsti.fi/assets/App-gisvOVt2.js";
const unlistedChunkUrl = "https://ropekonsti.fi/assets/App-DEZNGW7N.js";

const metadataGlobal = globalThis as typeof globalThis & {
  _sentryModuleMetadata?: Record<string, Record<string, boolean>>;
};

const captureWithJoin = async (frames: StackFrame[]): Promise<ErrorEvent[]> => {
  const getCapturedEvents = initWithInjectedScriptFilter();

  captureEvent(errorEvent(frames));
  await flush(2000);

  return getCapturedEvents();
};

describe("Injected-script filter metadata join", () => {
  beforeEach(() => {
    // What the build writes at chunk load. Only this one chunk is named, so a
    // frame from anywhere else has to miss
    metadataGlobal._sentryModuleMetadata = {
      [`Error\n    at ${stampedChunkUrl}:1:1`]: {
        [sentryApplicationKeyProperty]: true,
      },
    };
  });

  afterEach(async () => {
    delete metadataGlobal._sentryModuleMetadata;
    await close();
  });

  // The other filter tests hand the SDK frames that already carry metadata. This
  // drives the step that puts it there, matching a frame to a stamped chunk by
  // filename. If that match stops working every frame reads as third-party and
  // the whole stream is discarded, which nothing else would catch
  test("should attach chunk metadata to a frame by filename, keeping the error", async () => {
    const events = await captureWithJoin([
      { filename: stampedChunkUrl, lineno: 5, colno: 10 },
    ]);

    expect(events).toHaveLength(1);
  });

  // The same shape of frame, from a URL the map does not name: the join matches
  // an exact filename rather than anything that looks like the app's own asset
  test("should drop a frame whose URL the join does not name", async () => {
    const events = await captureWithJoin([
      { filename: unlistedChunkUrl, lineno: 5, colno: 10 },
    ]);

    expect(events).toHaveLength(0);
  });
});
