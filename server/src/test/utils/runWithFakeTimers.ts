import { vi } from "vitest";

// Runs an operation under fake timers and fires every timer it schedules, so a retry delay
// doesn't slow the test down
export const runWithFakeTimers = async <T>(
  run: () => PromiseLike<T>,
): Promise<T> => {
  vi.useFakeTimers();
  try {
    const operation = run();
    // Handled before the timers run, so a rejection while they fire waits for the await below
    // instead of surfacing as unhandled. The timers are awaited on their own, so an operation
    // that keeps rescheduling fails with the timer runner's loop error rather than a hang.
    const handled = Promise.allSettled([operation]);
    await vi.runAllTimersAsync();
    await handled;
    return await operation;
  } finally {
    vi.useRealTimers();
  }
};
