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

  // Refresh triggers can fire together (e.g. an overdue interval tick, the
  // online event, and a page resume when a phone wakes), and concurrent
  // loads could dispatch a slower stale response over a newer one, so only
  // one load runs at a time
  let fetchInFlight = false;
  let fetchQueued = false;

  const fetchData = async (): Promise<void> => {
    if (fetchInFlight) {
      return;
    }
    fetchInFlight = true;
    try {
      let succeeded = false;
      do {
        fetchQueued = false;
        succeeded = await loadData();
        onLoadFinished(succeeded);
        // A successful load satisfies triggers that arrived while it ran;
        // a failed one reruns for them (e.g. its requests failed right
        // before connectivity returned). fetchQueued is set while loadData
        // is awaited, which type narrowing can't see
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } while (fetchQueued && !succeeded);
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

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  fetchData();

  // Interval ticks don't queue behind an in-flight load: the next tick
  // arrives within the update interval anyway
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const updateTimer = setInterval(fetchData, dataUpdateInterval * 1000);

  // Refresh immediately when connectivity returns; the successful response
  // also heals a possible stale network error toast
  addEventListener("online", queueFetchData);

  // While the page is hidden (screen off, background tab) the browser
  // freezes timers and polling lags behind, so refresh on resume - but only
  // when hidden long enough to actually miss a poll, so that plain tab
  // switching doesn't cause request bursts
  const offPageResume = onPageResume((hiddenDurationMs) => {
    if (hiddenDurationMs >= dataUpdateInterval * 1000) {
      queueFetchData();
    }
  });

  return () => {
    clearInterval(updateTimer);
    removeEventListener("online", queueFetchData);
    offPageResume();
  };
};
