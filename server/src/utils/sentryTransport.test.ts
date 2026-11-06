import { close, flush, init } from "@sentry/node";
import { afterEach, expect, test } from "vitest";
import { createLogger } from "winston";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";
import { SentryTransport } from "server/utils/sentryTransport";

afterEach(async () => {
  await close();
});

const startRecording = (): ReturnType<typeof createRecordingTransport> => {
  const recording = createRecordingTransport();
  init({ dsn: fakeDsn, transport: recording.transport });
  return recording;
};

test("should report the logged Error with its cause", async () => {
  const { getCapturedEvents } = startRecording();
  const logger = createLogger({ transports: [new SentryTransport()] });

  logger.error("Saving failed", {
    error: new Error("Saving failed", { cause: new Error("Disk full") }),
  });
  await flush(2000);

  const values = getCapturedEvents()[0].exception?.values ?? [];
  expect(values.map((value) => value.value)).toEqual([
    "Disk full",
    "Saving failed",
  ]);
});

test("should report a log without an Error from its message", async () => {
  const { getCapturedEvents } = startRecording();
  const logger = createLogger({ transports: [new SentryTransport()] });

  logger.error("Plain failure");
  await flush(2000);

  expect(getCapturedEvents()[0].exception?.values?.[0]).toMatchObject({
    type: "Error",
    value: "Plain failure",
  });
});

// Each log is captured in its own scope, so nothing set for one log reaches the next
test("should not carry one log's extra data over to the next", async () => {
  const { getCapturedEvents } = startRecording();
  const logger = createLogger({ transports: [new SentryTransport()] });

  logger.error("First", { programItemId: "abc" });
  logger.error("Second");
  await flush(2000);

  const events = getCapturedEvents();
  expect(events[0].extra).toMatchObject({ programItemId: "abc" });
  expect(events[1].extra).not.toHaveProperty("programItemId");
});
