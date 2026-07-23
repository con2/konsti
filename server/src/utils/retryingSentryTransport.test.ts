import { expect, test, vi, afterEach, describe } from "vitest";
import { makeNodeTransport } from "@sentry/node";
import { makeRetryingNodeTransport } from "server/utils/retryingSentryTransport";
import { logger } from "server/utils/logger";

const { sendMock, flushMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  flushMock: vi.fn(),
}));

vi.mock("@sentry/node", () => ({
  makeNodeTransport: vi.fn(() => ({ send: sendMock, flush: flushMock })),
}));

type Envelope = Parameters<ReturnType<typeof makeNodeTransport>["send"]>[0];
type TransportOptions = Parameters<typeof makeNodeTransport>[0];

const testEnvelope = [{}, []] as Envelope;

const buildTransport = (): ReturnType<typeof makeRetryingNodeTransport> =>
  makeRetryingNodeTransport({} as TransportOptions);

// Runs a send with fake timers so the retry delay doesn't slow tests down
const runSend = async (
  transport: ReturnType<typeof makeRetryingNodeTransport>,
): Promise<Awaited<ReturnType<(typeof transport)["send"]>>> => {
  vi.useFakeTimers();
  try {
    const promise = transport.send(testEnvelope);
    await vi.runAllTimersAsync();
    return await promise;
  } finally {
    vi.useRealTimers();
  }
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("makeRetryingNodeTransport", () => {
  test("should not retry when send succeeds", async () => {
    sendMock.mockResolvedValue({ statusCode: 200 });

    const response = await runSend(buildTransport());

    expect(response).toEqual({ statusCode: 200 });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  test("should not retry when Sentry responds with 4xx", async () => {
    sendMock.mockResolvedValue({ statusCode: 429 });

    const response = await runSend(buildTransport());

    expect(response).toEqual({ statusCode: 429 });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  test("should retry once when Sentry responds with 5xx", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    sendMock
      .mockResolvedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const response = await runSend(buildTransport());

    expect(response).toEqual({ statusCode: 200 });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });

  test("should retry once when send fails with network error", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    sendMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ statusCode: 200 });

    const response = await runSend(buildTransport());

    expect(response).toEqual({ statusCode: 200 });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });

  test("should deliver event when second retry succeeds after two 5xx responses", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    sendMock
      .mockResolvedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce({ statusCode: 502 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const response = await runSend(buildTransport());

    expect(response).toEqual({ statusCode: 200 });
    expect(sendMock).toHaveBeenCalledTimes(3);
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });

  test("should log dropped event when 5xx persists after retries", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    sendMock.mockResolvedValue({ statusCode: 503 });

    const response = await runSend(buildTransport());

    expect(response).toEqual({ statusCode: 503 });
    expect(sendMock).toHaveBeenCalledTimes(3);
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual(
      "Sentry event dropped: upstream responded with 503",
    );
  });

  test("should log dropped event when network error persists after retries", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    sendMock.mockRejectedValue(new TypeError("fetch failed"));

    vi.useFakeTimers();
    let settledError: unknown;
    try {
      const transport = buildTransport();
      // Swallow the rejection up front so it is never unhandled
      const settled = (async (): Promise<unknown> => {
        try {
          await transport.send(testEnvelope);
          return null;
        } catch (error) {
          return error;
        }
      })();
      await vi.runAllTimersAsync();
      settledError = await settled;
    } finally {
      vi.useRealTimers();
    }

    expect(settledError).toBeInstanceOf(TypeError);
    expect((settledError as TypeError).message).toEqual("fetch failed");

    expect(sendMock).toHaveBeenCalledTimes(3);
    const loggedError = errorLoggerSpy.mock.calls[0][0] as Error;
    expect(loggedError.message).toEqual("Sentry event dropped: fetch failed");
  });

  test("should log error once per failure episode and warn on repeats", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    const warnLoggerSpy = vi.spyOn(logger, "warn");
    const transport = buildTransport();

    sendMock.mockResolvedValue({ statusCode: 503 });
    await runSend(transport);
    await runSend(transport);

    expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
    expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
    expect(warnLoggerSpy).toHaveBeenCalledWith(
      "Sentry event dropped: upstream responded with 503",
    );

    sendMock.mockResolvedValue({ statusCode: 200 });
    await runSend(transport);

    sendMock.mockResolvedValue({ statusCode: 503 });
    await runSend(transport);

    expect(errorLoggerSpy).toHaveBeenCalledTimes(2);
  });

  test("should keep the wrapped transport's flush", async () => {
    flushMock.mockResolvedValue(true);

    const result = await buildTransport().flush(1000);

    expect(result).toEqual(true);
    expect(flushMock).toHaveBeenCalledWith(1000);
  });
});
