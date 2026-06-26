import { afterEach, describe, expect, test } from "vitest";
import { init, captureException, flush, close, withScope } from "@sentry/node";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";
import { scrubIpAddress } from "server/utils/scrubIpAddress";

describe("Sentry error reporting (server)", () => {
  afterEach(async () => {
    await close();
  });

  test("should send captured errors to the transport", async () => {
    const { transport, getCapturedEvents } = createRecordingTransport();

    init({
      dsn: fakeDsn,
      transport,
      beforeSend: scrubIpAddress,
    });

    captureException(new Error("Server boom"));
    await flush(2000);

    const events = getCapturedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].exception?.values?.[0]).toMatchObject({
      type: "Error",
      value: "Server boom",
    });
  });

  test("should scrub the user IP address from sent errors", async () => {
    const { transport, getCapturedEvents } = createRecordingTransport();

    init({
      dsn: fakeDsn,
      transport,
      beforeSend: scrubIpAddress,
    });

    withScope((scope) => {
      scope.setUser({ id: "user-1", ip_address: "203.0.113.5" });
      captureException(new Error("Server boom with IP"));
    });
    await flush(2000);

    const events = getCapturedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].user?.id).toBe("user-1");
    expect(events[0].user?.ip_address).toBeUndefined();
  });
});
