import { getEventListeners } from "node:events";
import { expect, test } from "vitest";
import { sleep } from "server/utils/sleep";

test("should leave no abort listener behind once the sleep is done", async () => {
  const stop = new AbortController();

  await sleep(1, stop.signal);

  expect(getEventListeners(stop.signal, "abort")).toHaveLength(0);
});

test("should not sleep at all on a signal already aborted", async () => {
  const stop = new AbortController();
  stop.abort();

  await expect(sleep(60 * 60 * 1000, stop.signal)).resolves.toBeUndefined();
});

test("should end the sleep early when its signal aborts", async () => {
  const stop = new AbortController();
  const sleeping = sleep(60 * 60 * 1000, stop.signal);

  stop.abort();

  await expect(sleeping).resolves.toBeUndefined();
});
