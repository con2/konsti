import { vi } from "vitest";

// Runs an operation under fake timers and fires every timer it schedules, so a retry delay
// doesn't slow the test down
export const runWithFakeTimers = async <T>(
  run: () => PromiseLike<T>,
): Promise<T> => {
  vi.useFakeTimers();
  try {
    const operation = run();
    const timers = vi.runAllTimersAsync();
    // Both settle before either is read, so a rejection while the timers fire is handled by
    // the time real time returns instead of surfacing as unhandled
    await Promise.allSettled([operation, timers]);
    await timers;
    return await operation;
  } finally {
    vi.useRealTimers();
  }
};
