import { afterEach, describe, expect, test } from "vitest";
import { init, captureException, flush, close } from "@sentry/react";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";

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
