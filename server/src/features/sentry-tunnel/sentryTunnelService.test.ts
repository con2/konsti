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

  test("should return error when upstream responds with non-2xx status", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 429 })),
    );

    const result = await resendSentryRequest(
      buildEnvelope("https://public@o123.ingest.sentry.io/6579203"),
    );

    expect(result).toEqual({
      message: "Sentry tunnel: Upstream error",
      status: "error",
      errorId: "unknown",
    });
    expect(errorLoggerSpy).toHaveBeenCalled();
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
