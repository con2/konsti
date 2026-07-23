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

const testEnvelope = buildEnvelope(
  "https://public@o123.ingest.sentry.io/6579203",
);

const upstreamError = {
  message: "Sentry tunnel: Upstream error",
  status: "error",
  errorId: "unknown",
};

// Runs the tunnel with fake timers so the retry delay doesn't slow tests down
const runTunnel = async (
  envelope: Buffer,
): ReturnType<typeof resendSentryRequest> => {
  vi.useFakeTimers();
  try {
    const promise = resendSentryRequest(envelope);
    await vi.runAllTimersAsync();
    return await promise;
  } finally {
    vi.useRealTimers();
  }
};

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

    const result = await resendSentryRequest(testEnvelope);

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://o123.ingest.sentry.io/api/6579203/envelope/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("should not retry when upstream responds with 4xx status", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(null, { status: 429 })),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runTunnel(testEnvelope);

    expect(result).toEqual(upstreamError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual(
      "Sentry tunnel: upstream responded with 429",
    );
  });

  test("should retry once and log error with upstream details when 5xx persists", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response("upstream rejection reason", {
          status: 503,
          headers: { "x-sentry-error": "load shedding" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runTunnel(testEnvelope);

    expect(result).toEqual(upstreamError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual(
      "Sentry tunnel: upstream responded with 503: load shedding / upstream rejection reason",
    );
  });

  test("should log error without details when non-2xx response has none", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(new Response(null, { status: 502 })),
        ),
    );

    const result = await runTunnel(testEnvelope);

    expect(result).toEqual(upstreamError);
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual(
      "Sentry tunnel: upstream responded with 502",
    );
  });

  test("should deliver envelope when retry succeeds after 5xx", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(null, { status: 503 })),
      )
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(null, { status: 200 })),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runTunnel(testEnvelope);

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });

  test("should deliver envelope when retry succeeds after network error", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.reject(new TypeError("fetch failed")),
      )
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(null, { status: 200 })),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runTunnel(testEnvelope);

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });

  test("should retry once and log upstream error when network error persists", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    const fetchMock = vi
      .fn()
      .mockRejectedValue(
        new TypeError("fetch failed", { cause: new Error("read ECONNRESET") }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runTunnel(testEnvelope);

    expect(result).toEqual(upstreamError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
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

    const result = await runTunnel(testEnvelope);

    expect(result).toEqual(upstreamError);
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
