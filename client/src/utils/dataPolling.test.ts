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

  // Freshness counts from when the load started, not when it finished: a
  // slow load would otherwise hide the tick skipped right after it
  test("loads on resume after a skipped tick even when the last load finished recently", async () => {
    await start();
    vi.mocked(loadData).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return true;
    });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS + 5000);
    expect(loadData).toHaveBeenCalledTimes(2);

    setPageHidden(true);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 3000);
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

  // Without this the untouched interval's next tick would land seconds after
  // the resume load
  test("restarts the interval when a resume refresh fires", async () => {
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

  // Connectivity returning to a hidden page is handled like its ticks: the
  // resume refresh covers it once the data has gone stale
  test("does not load on the online event while the page is hidden", async () => {
    await start();
    setPageHidden(true);

    dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(1);
  });

  test("loads on the online event while the page is visible", async () => {
    await start();

    dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);

    expect(loadData).toHaveBeenCalledTimes(2);
  });

  test("stops loading once stopped", async () => {
    await start();
    stopPolling?.();
    stopPolling = undefined;

    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(loadData).toHaveBeenCalledTimes(1);
  });
});
