import { vi } from "vitest";

// Runs an operation under fake timers and fires every timer it schedules, so a retry delay
// doesn't slow the test down
export const runWithFakeTimers = async <T>(
  run: () => PromiseLike<T>,
): Promise<T> => {
  vi.useFakeTimers();
  try {
    const promise = run();
    await vi.runAllTimersAsync();
    return await promise;
  } finally {
    vi.useRealTimers();
  }
};
