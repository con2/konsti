// Defers low-priority work until the browser reports spare time. No shipping
// Safari or iOS version implements requestIdleCallback, so the timer branch is
// the path every Apple device takes rather than a legacy edge case: it gives
// no guarantee the main thread is free, but it still keeps the work off the
// critical path. Returns a cancel function.
const FALLBACK_DELAY_MS = 2000;

export const whenIdle = (task: () => void): (() => void) => {
  if (typeof requestIdleCallback === "undefined") {
    const timeout = setTimeout(task, FALLBACK_DELAY_MS);
    return () => {
      clearTimeout(timeout);
    };
  }

  // eslint-disable-next-line compat/compat -- Guarded by the check above
  const handle = requestIdleCallback(task);
  return () => {
    cancelIdleCallback(handle);
  };
};
