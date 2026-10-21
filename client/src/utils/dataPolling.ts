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
  let lastSuccessfulLoadAt = 0;

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
        if (succeeded) {
          lastSuccessfulLoadAt = Date.now();
        }
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

  // A hidden page (screen off, background tab) polls for nobody, so its
  // ticks are skipped rather than the timer stopped: a skipped tick costs
  // nothing and keeps the tick phase where it was
  const fetchDataIfVisible = (): void => {
    if (document.hidden) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  };

  // Even a page that loads hidden has to boot
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  fetchData();

  // Interval ticks don't queue behind an in-flight load: the next tick
  // arrives within the update interval anyway
  let updateTimer = setInterval(fetchDataIfVisible, dataUpdateIntervalMs);

  // Refresh immediately when connectivity returns; the successful response
  // also heals a possible stale network error toast
  addEventListener("online", queueFetchData);

  // Refresh on resume when the last good data is older than a poll - the
  // ticks were skipped or the page was frozen - but not on plain tab
  // switching, which would otherwise cause request bursts. A boot load that
  // failed in a background tab counts as no data, so its first foregrounding
  // retries. The interval restarts so the next tick doesn't land right after
  // the resume load
  const offPageResume = onPageResume(() => {
    if (Date.now() - lastSuccessfulLoadAt < dataUpdateIntervalMs) {
      return;
    }
    clearInterval(updateTimer);
    updateTimer = setInterval(fetchDataIfVisible, dataUpdateIntervalMs);
    queueFetchData();
  });

  return () => {
    clearInterval(updateTimer);
    removeEventListener("online", queueFetchData);
    offPageResume();
  };
};
