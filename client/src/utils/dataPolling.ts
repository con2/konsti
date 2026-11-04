import { config } from "shared/config";
import { loadData } from "client/utils/loadData";
import { onPageResume } from "client/utils/pageLifecycle";

// Kept out of the component that starts it, both because it is a good deal of
// machinery for a view to hold and because the React Compiler declines any
// function whose body contains a `finally` (or a `try` with no `catch`), which
// the in-flight guard below needs
export const startDataPolling = (
  onLoadFinished: (succeeded: boolean) => void,
): (() => void) => {
  const { dataUpdateInterval } = config.client();
  const dataUpdateIntervalMs = dataUpdateInterval * 1000;

  // Refresh triggers can fire together (e.g. an overdue interval tick, the
  // online event, and a page resume when a phone wakes), and concurrent
  // loads could dispatch a slower stale response over a newer one, so only
  // one load runs at a time
  let fetchInFlight = false;
  let fetchQueued = false;
  // When the last load started; zero makes the next resume load whatever the
  // time, for a trigger a hidden page deferred to it
  let lastLoadStartedAt = 0;
  let stopped = false;
  let tickTimer: ReturnType<typeof setTimeout> | undefined;

  // Each load restarts the countdown to the next tick, so a load from any
  // trigger pushes the tick out instead of the tick landing right after it
  const scheduleNextTick = (): void => {
    if (stopped) {
      return;
    }
    clearTimeout(tickTimer);
    tickTimer = setTimeout(tick, dataUpdateIntervalMs);
  };

  // Data needs a refresh once its load started a poll ago, or when the clock
  // was set back past that start
  const isStale = (): boolean => {
    const ageMs = Date.now() - lastLoadStartedAt;
    return ageMs < 0 || ageMs >= dataUpdateIntervalMs;
  };

  const fetchData = async (): Promise<void> => {
    if (fetchInFlight) {
      return;
    }
    fetchInFlight = true;
    try {
      let succeeded = false;
      do {
        fetchQueued = false;
        lastLoadStartedAt = Date.now();
        scheduleNextTick();
        succeeded = await loadData();
        onLoadFinished(succeeded);
        // A failure on a hidden page shows no error, so it is retried on the
        // resume rather than rerun for nobody
        if (!succeeded && document.hidden) {
          lastLoadStartedAt = 0;
        }
      } while (
        // A success answers the triggers that arrived meanwhile unless it took
        // so long its data is already stale; a failure reruns for them.
        // fetchQueued is set while loadData is awaited, which type narrowing
        // can't see.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        fetchQueued &&
        (!succeeded || isStale()) &&
        !stopped &&
        !document.hidden
      );
    } finally {
      fetchInFlight = false;
    }
  };

  // Connectivity and resume refreshes must not be dropped just because a
  // load is in flight - an in-flight request can hang until the request
  // timeout - so they queue a trailing rerun
  const queueFetchData = (): void => {
    fetchQueued = true;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  };

  // A tick on a hidden page or during a load only rearms the countdown: a
  // resume the page never hears about still finds the poll running, and a
  // slow server gets a pause between loads rather than back-to-back reruns
  const tick = (): void => {
    if (document.hidden || fetchInFlight) {
      scheduleNextTick();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  };

  // Even a page that loads hidden has to boot
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  fetchData();

  // Refresh immediately when connectivity returns; the successful response
  // also heals a possible stale network error toast. A hidden page polls for
  // nobody, so it takes the refresh on its resume instead.
  const refreshWhenOnline = (): void => {
    // A load in flight answers it as it would any trigger, and zeroing its
    // start would owe a refresh its fresh data does not need
    if (document.hidden && !fetchInFlight) {
      lastLoadStartedAt = 0;
      return;
    }
    queueFetchData();
  };
  addEventListener("online", refreshWhenOnline);

  // Plain tab switching must not cause request bursts, so only stale data is
  // refreshed
  const offPageResume = onPageResume(() => {
    if (isStale()) {
      queueFetchData();
    }
  });

  return () => {
    stopped = true;
    clearTimeout(tickTimer);
    removeEventListener("online", refreshWhenOnline);
    offPageResume();
  };
};
