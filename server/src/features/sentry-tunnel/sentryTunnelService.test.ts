import { expect, test, vi, afterEach, describe } from "vitest";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";
import { logger } from "server/utils/logger";

const buildEnvelope = (dsn: string): Buffer =>
  Buffer.from(
    [
      JSON.stringify({ event_id: "abc123", dsn }),
      JSON.stringify({ type: "event" }),
      JSON.stringify({ message: "Something went wrong!", level: "error" }),
    ].join("\n"),
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("resendSentryRequest", () => {
  test("should post envelope to the ingest host from the DSN", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resendSentryRequest(
      buildEnvelope("https://public@o123.ingest.sentry.io/6579203"),
    );

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://o123.ingest.sentry.io/api/6579203/envelope/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("should log error with upstream details when response is non-2xx", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("upstream rejection reason", {
          status: 503,
          headers: { "x-sentry-error": "load shedding" },
        }),
      ),
    );

    const result = await resendSentryRequest(
      buildEnvelope("https://public@o123.ingest.sentry.io/6579203"),
    );

    expect(result).toEqual({
      message: "Sentry tunnel: Upstream error",
      status: "error",
      errorId: "unknown",
    });
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toContain("503");
    expect(loggedError.message).toContain("load shedding");
    expect(loggedError.message).toContain("upstream rejection reason");
  });

  test("should log error without details when non-2xx response has none", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 502 })),
    );

    const result = await resendSentryRequest(
      buildEnvelope("https://public@o123.ingest.sentry.io/6579203"),
    );

    expect(result).toEqual({
      message: "Sentry tunnel: Upstream error",
      status: "error",
      errorId: "unknown",
    });
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual(
      "Sentry tunnel: upstream responded with 502",
    );
  });

  test("should log upstream error when fetch fails with network error", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new TypeError("fetch failed", {
          cause: new Error("read ECONNRESET"),
        }),
      ),
    );

    const result = await resendSentryRequest(
      buildEnvelope("https://public@o123.ingest.sentry.io/6579203"),
    );

    expect(result).toEqual({
      message: "Sentry tunnel: Upstream error",
      status: "error",
      errorId: "unknown",
    });
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual(
      "Sentry tunnel: upstream request failed: fetch failed / read ECONNRESET",
    );
    expect(loggedError.cause).toBeUndefined();
  });

  test("should flatten AggregateError members into upstream error message", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new TypeError("fetch failed", {
          // eslint-disable-next-line unicorn/error-message -- Node network AggregateErrors have no message
          cause: new AggregateError([
            new Error("connect ETIMEDOUT 34.160.81.0:443"),
            new Error("connect ENETUNREACH 2600:1901:0:5e8a:::443"),
          ]),
        }),
      ),
    );

    const result = await resendSentryRequest(
      buildEnvelope("https://public@o123.ingest.sentry.io/6579203"),
    );

    expect(result).toEqual({
      message: "Sentry tunnel: Upstream error",
      status: "error",
      errorId: "unknown",
    });
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual(
      "Sentry tunnel: upstream request failed: fetch failed / connect ETIMEDOUT 34.160.81.0:443 / connect ENETUNREACH 2600:1901:0:5e8a:::443",
    );
  });

  test("should not forward envelope with non-Sentry DSN host", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await resendSentryRequest(
      buildEnvelope("https://public@evil.example.com/6579203"),
    );

    expect(result).toEqual({
      message: "Sentry tunnel: Invalid host",
      status: "error",
      errorId: "unknown",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("should not forward envelope with unknown project id", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await resendSentryRequest(
      buildEnvelope("https://public@o123.ingest.sentry.io/999999"),
    );

    expect(result).toEqual({
      message: "Sentry tunnel: Invalid project",
      status: "error",
      errorId: "unknown",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
