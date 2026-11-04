import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { setPageHidden } from "client/test/pageVisibility";
import { startDataPolling } from "client/utils/dataPolling";
import { loadData } from "client/utils/loadData";

vi.mock("client/utils/loadData", () => ({ loadData: vi.fn() }));

const INTERVAL_MS = config.client().dataUpdateInterval * 1000;

let stopPolling: (() => void) | undefined;

// The boot load holds the in-flight guard until its promise settles, and a
// trigger arriving behind an in-flight successful load is dropped by design,
// so every scenario lets the boot load finish before doing anything else
const start = async (): Promise<void> => {
  stopPolling = startDataPolling(vi.fn());
  await vi.advanceTimersByTimeAsync(0);
};

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-08-16T12:00:00.000Z") });
  vi.mocked(loadData).mockReset();
  vi.mocked(loadData).mockResolvedValue(true);
});

afterEach(() => {
  stopPolling?.();
  stopPolling = undefined;
  setPageHidden(false);
  vi.useRealTimers();
});

describe("data polling", () => {
  test("loads once on start and again on every interval tick", async () => {
    await start();
    expect(loadData).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(loadData).toHaveBeenCalledTimes(2);
  });

  // A hidden page polls for nobody, so a tick there is skipped
  test("does not load on a tick while the page is hidden", async () => {
    await start();
    setPageHidden(true);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(loadData).toHaveBeenCalledTimes(1);
  });

  // The skipped ticks left the data stale, so showing the page refreshes it
  test("loads on resume after a tick was skipped", async () => {
    await start();
    setPageHidden(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(2);
  });

  // Freshness counts from when the load started, not when it finished, so
  // the time a slow load took is not credited to its data. The page is
  // frozen rather than ticking so that no deferred tick decides instead.
  test("loads on resume after a frozen page when the last slow load finished under a poll ago", async () => {
    await start();
    vi.mocked(loadData).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return true;
    });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS + 5000);
    expect(loadData).toHaveBeenCalledTimes(2);

    setPageHidden(true);
    vi.setSystemTime(Date.now() + INTERVAL_MS - 3000);
    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(3);
  });

  // Plain tab switching must not cause request bursts
  test("does not load on resume while the last load is fresh", async () => {
    await start();
    setPageHidden(true);
    await vi.advanceTimersByTimeAsync(10_000);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(1);
  });

  // A failed load is still a recent attempt, or an outage would turn every
  // tab switch into a load
  test("does not load on resume while the last failed load is fresh", async () => {
    vi.mocked(loadData).mockResolvedValue(false);
    await start();
    expect(loadData).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 3; i++) {
      setPageHidden(true);
      await vi.advanceTimersByTimeAsync(10_000);
      setPageHidden(false);
      await vi.advanceTimersByTimeAsync(0);
    }

    expect(loadData).toHaveBeenCalledTimes(1);
  });

  // A frozen page (screen off) runs no timers at all, so only the elapsed
  // time can say the data is stale
  test("loads on resume after the page was frozen", async () => {
    await start();
    setPageHidden(true);
    vi.setSystemTime(Date.now() + 5 * INTERVAL_MS);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(2);
  });

  // A clock set back would otherwise make the data look fresh for as long
  // as the step was
  test("loads on resume after the clock was set back", async () => {
    await start();
    setPageHidden(true);
    vi.setSystemTime(Date.now() - 5 * INTERVAL_MS);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(2);
  });

  // Without this the next tick would land seconds after the resume load
  test("schedules the next tick a full interval after a resume refresh", async () => {
    await start();
    setPageHidden(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 1.5);
    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(loadData).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    expect(loadData).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(loadData).toHaveBeenCalledTimes(3);
  });

  // A tab opened in the background still has to boot, and its fresh boot
  // data needs no second load when it is first shown
  test("boots a hidden page and does not reload it when first shown soon after", async () => {
    setPageHidden(true);
    await start();
    expect(loadData).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10_000);
    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(1);
  });

  // Every load starts the countdown to the next tick, so a load from another
  // trigger is not followed by a tick seconds later
  test("schedules the next tick a full interval after a load from the online event", async () => {
    await start();
    await vi.advanceTimersByTimeAsync(30_000);
    dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(loadData).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    expect(loadData).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(loadData).toHaveBeenCalledTimes(3);
  });

  // The tick a hidden page defers must not stop the ones after it
  test("keeps ticking after ticks were deferred while hidden", async () => {
    await start();
    setPageHidden(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2.5);
    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(loadData).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);
    expect(loadData).toHaveBeenCalledTimes(4);
  });

  // Connectivity returning to a hidden page is handled like its ticks: the
  // refresh waits for the resume, whatever the age of the data
  test("defers the online event on a hidden page to its resume", async () => {
    await start();
    setPageHidden(true);

    dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(loadData).toHaveBeenCalledTimes(1);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(loadData).toHaveBeenCalledTimes(2);
  });

  test("loads on the online event while the page is visible", async () => {
    await start();

    dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(2);
  });

  // A rerun on a hidden page would stamp the data fresh and make the resume
  // skip the refresh the failed load still owes
  test("defers the rerun of a failed load to the resume when the page was hidden meanwhile", async () => {
    await start();
    vi.mocked(loadData).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return false;
    });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(loadData).toHaveBeenCalledTimes(2);
    dispatchEvent(new Event("online"));
    setPageHidden(true);

    await vi.advanceTimersByTimeAsync(5000 + 20_000);
    expect(loadData).toHaveBeenCalledTimes(2);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(loadData).toHaveBeenCalledTimes(3);
  });

  // The hidden page showed no error for the failure, so being shown again
  // must retry rather than treat the failed attempt as fresh data
  test("loads on resume when a load failed while the page was hidden", async () => {
    await start();
    vi.mocked(loadData).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return false;
    });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(loadData).toHaveBeenCalledTimes(2);
    setPageHidden(true);

    await vi.advanceTimersByTimeAsync(5000 + 10_000);
    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(3);
  });

  // A request that outlived a frozen page answers with data as old as the
  // request, so the resume that found the data stale still loads after it
  test("loads again after a load in flight across a frozen page succeeds", async () => {
    await start();
    let finishLoad = (): void => undefined;
    vi.mocked(loadData).mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => {
        finishLoad = resolve;
      });
      return true;
    });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(loadData).toHaveBeenCalledTimes(2);

    setPageHidden(true);
    vi.setSystemTime(Date.now() + 5 * INTERVAL_MS);
    setPageHidden(false);
    finishLoad();
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(3);
  });

  // The load in flight answers the online event; owing a refresh on top of
  // its fresh data would make a quick tab switch load again
  test("does not owe a refresh for an online event on a hidden page during a successful load", async () => {
    await start();
    vi.mocked(loadData).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    setPageHidden(true);
    dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(loadData).toHaveBeenCalledTimes(2);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(2);
  });

  // A queued rerun after stopping would arm a timer nothing can clear
  test("does not rerun or tick again when stopped during a failing load with a refresh queued", async () => {
    vi.mocked(loadData).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return false;
    });
    stopPolling = startDataPolling(vi.fn());
    dispatchEvent(new Event("online"));
    stopPolling();
    stopPolling = undefined;

    await vi.advanceTimersByTimeAsync(5000 + INTERVAL_MS * 2);

    expect(loadData).toHaveBeenCalledTimes(1);
  });

  test("stops loading once stopped", async () => {
    await start();
    stopPolling?.();
    stopPolling = undefined;

    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(loadData).toHaveBeenCalledTimes(1);
  });
});
