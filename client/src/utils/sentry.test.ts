import type { ErrorEvent, StackFrame } from "@sentry/react";
import {
  captureEvent,
  captureException,
  close,
  flush,
  init,
} from "@sentry/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { sentryApplicationKeyProperty } from "shared/config/sentryConfig";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";
import {
  errorEvent,
  initWithInjectedScriptFilter,
} from "client/test/sentryFilterHelpers";
import { injectedScriptFilterOptions } from "client/utils/injectedScriptFilter";

const appChunkUrl = "https://ropekonsti.fi/assets/App-gisvOVt2.js";
// The SDK ships in a chunk of its own, stamped like every other
const sentryChunkUrl = "https://ropekonsti.fi/assets/sentry-DwZhyS1s.js";

// What the build stamps into the app's own chunks, as the SDK attaches it to a
// frame once it has matched one
const appFrame = (filename: string): StackFrame => ({
  filename,
  lineno: 1,
  colno: 1,
  module_metadata: { [sentryApplicationKeyProperty]: true },
});

// Injected code has no script URL, so its frames name the page it was evaluated
// on and carry no metadata
const injectedFrame = (filename: string): StackFrame => ({
  filename,
  lineno: 226,
  colno: 408,
});

const captureThroughFilter = async (
  frames: StackFrame[],
): Promise<ErrorEvent[]> => {
  const getCapturedEvents = initWithInjectedScriptFilter();

  captureEvent(errorEvent(frames));
  await flush(2000);

  return getCapturedEvents();
};

describe("Sentry error reporting (client)", () => {
  afterEach(async () => {
    await close();
  });

  test("should send captured errors to the transport", async () => {
    const { transport, getCapturedEvents } = createRecordingTransport();

    init({
      dsn: fakeDsn,
      transport,
    });

    captureException(new Error("Client boom"));
    await flush(2000);

    const events = getCapturedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].exception?.values?.[0]).toMatchObject({
      type: "Error",
      value: "Client boom",
    });
  });

  test("should not attach the user IP address by default", async () => {
    const { transport, getCapturedEvents } = createRecordingTransport();

    init({
      dsn: fakeDsn,
      transport,
    });

    captureException(new Error("Client boom without IP"));
    await flush(2000);

    const events = getCapturedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].user?.ip_address).toBeUndefined();
  });
});

describe("Injected-script filter", () => {
  afterEach(async () => {
    await close();
  });

  test("should keep an error thrown by the app's own code", async () => {
    const events = await captureThroughFilter([
      appFrame(appChunkUrl),
      appFrame("https://ropekonsti.fi/assets/index-BDUtopG4.js"),
    ]);

    expect(events).toHaveLength(1);
  });

  // The stack an iOS in-app browser produced, where every frame names a Konsti
  // route rather than a script
  test("should drop an error whose every frame is injected", async () => {
    const events = await captureThroughFilter([
      injectedFrame("/program/list"),
      injectedFrame("/program/item/kirpputori-perjantai-alkuilta-1600"),
    ]);

    expect(events).toHaveLength(0);
  });

  test("should keep an error that touches the app's code at all", async () => {
    const events = await captureThroughFilter([
      injectedFrame("/program/list"),
      appFrame(appChunkUrl),
    ]);

    expect(events).toHaveLength(1);
  });

  // Pins a known cost of dropping rather than tagging: the integration discards
  // the frames it cannot place, and an empty set satisfies its "every frame is
  // third-party" test vacuously
  test("should drop an error whose frames carry no filename", async () => {
    const events = await captureThroughFilter([
      { function: "?", lineno: 1, colno: 1 },
    ]);

    expect(events).toHaveLength(0);
  });

  test("should drop an error whose stack trace is empty", async () => {
    const events = await captureThroughFilter([]);

    expect(events).toHaveLength(0);
  });

  // The boundary of that cost: with no stacktrace key at all the integration
  // cannot read frames and leaves the event alone, which is what keeps a thrown
  // non-Error reporting
  test("should keep an error carrying no stack trace at all", async () => {
    const getCapturedEvents = initWithInjectedScriptFilter();

    captureEvent({
      type: undefined,
      exception: { values: [{ type: "Error", value: "no stack" }] },
    });
    await flush(2000);

    expect(getCapturedEvents()).toHaveLength(1);
  });
});

describe("Injected-script filter inside the SDK's own wrapper", () => {
  const wrappedGlobal = globalThis as typeof globalThis & {
    _sentryWrappedDepth?: number;
  };

  // The SDK counts up while running a handler it wrapped, and that is the only
  // state in which ignoreSentryInternalFrames changes anything
  beforeEach(() => {
    wrappedGlobal._sentryWrappedDepth = 1;
  });

  afterEach(async () => {
    delete wrappedGlobal._sentryWrappedDepth;
    await close();
  });

  // The wrapper sits in the Sentry chunk, which the build stamps like any other,
  // so without the option this frame makes the error look first-party and the
  // injected script's error survives. Deleting the option fails this test
  test("should drop an injected-script error that came through a wrapped handler", async () => {
    const events = await captureThroughFilter([
      { ...appFrame(sentryChunkUrl), function: "i" },
      injectedFrame("/program/list"),
    ]);

    expect(events).toHaveLength(0);
  });

  // The other direction, pinned because the option is experimental: its
  // heuristic is "no source context and a name of one or two characters", which
  // a minified app frame matches too, and discarding the only placeable frame
  // leaves the vacuous "every frame is third-party"
  test("should drop an app error whose only frame looks like the wrapper", async () => {
    const events = await captureThroughFilter([
      { ...appFrame(appChunkUrl), function: "i" },
    ]);

    expect(events).toHaveLength(0);
  });
});

describe("Injected-script filter behaviour switch", () => {
  afterEach(async () => {
    await close();
  });

  // The reversible diagnostic: the same event the drop tests discard is kept and
  // marked instead, so what the filter removes can be counted before trusting it
  test("should tag rather than drop when dropping is switched off", async () => {
    const getCapturedEvents = initWithInjectedScriptFilter({
      ...injectedScriptFilterOptions,
      behaviour: "apply-tag-if-exclusively-contains-third-party-frames",
    });

    captureEvent(
      errorEvent([
        injectedFrame("/program/list"),
        injectedFrame("/program/item/kirpputori-perjantai-alkuilta-1600"),
      ]),
    );
    await flush(2000);

    const events = getCapturedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].tags?.third_party_code).toBe(true);
  });
});
