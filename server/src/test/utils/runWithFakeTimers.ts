import { vi } from "vitest";

// Runs an operation under fake timers and fires every timer it schedules, so a retry delay
// doesn't slow the test down. The operation is awaited alongside the timers so a rejection
// while they fire reaches the caller instead of surfacing as an unhandled one.
export const runWithFakeTimers = async <T>(
  run: () => PromiseLike<T>,
): Promise<T> => {
  vi.useFakeTimers();
  try {
    const [result] = await Promise.all([run(), vi.runAllTimersAsync()]);
    return result;
  } finally {
    vi.useRealTimers();
  }
};
