import { close, flush, init } from "@sentry/node";
import { afterEach, expect, test, vi } from "vitest";
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
  const testLogger = createLogger({ transports: [new SentryTransport()] });

  testLogger.error("Saving failed", {
    error: new Error("Saving failed", { cause: new Error("Disk full") }),
  });
  await flush(2000);

  const events = getCapturedEvents();
  expect(events).toHaveLength(1);
  expect(events[0].exception?.values?.map((value) => value.value)).toEqual([
    "Disk full",
    "Saving failed",
  ]);
});

// The app logger's format moves an Error logged on its own onto `info.error`,
// which is the path most error logs take. The test setup mocks the logger.
test("should report an Error logged on its own through the app logger", async () => {
  const { getCapturedEvents } = startRecording();
  const { logger } = await vi.importActual<
    typeof import("server/utils/logger")
  >("server/utils/logger");

  logger.error(new Error("Saving failed", { cause: new Error("Disk full") }));
  await flush(2000);

  const events = getCapturedEvents();
  expect(events).toHaveLength(1);
  expect(events[0].exception?.values?.map((value) => value.value)).toEqual([
    "Disk full",
    "Saving failed",
  ]);
});

test("should report a log without an Error as a message", async () => {
  const { getCapturedEvents } = startRecording();
  const testLogger = createLogger({ transports: [new SentryTransport()] });

  testLogger.error("Plain failure");
  await flush(2000);

  const events = getCapturedEvents();
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ message: "Plain failure", level: "error" });
});

// Each log is captured in its own scope, so nothing set for one log reaches the next
test("should not carry one log's extra data over to the next", async () => {
  const { getCapturedEvents } = startRecording();
  const testLogger = createLogger({ transports: [new SentryTransport()] });

  testLogger.error("First", { programItemId: "abc" });
  testLogger.error("Second");
  await flush(2000);

  const events = getCapturedEvents();
  expect(events).toHaveLength(2);
  expect(events[0].extra).toMatchObject({ programItemId: "abc" });
  expect(events[1].extra).not.toHaveProperty("programItemId");
});
