import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { startDataPolling } from "client/utils/dataPolling";
import { loadData } from "client/utils/loadData";

vi.mock("client/utils/loadData", () => ({ loadData: vi.fn() }));

const INTERVAL_MS = config.client().dataUpdateInterval * 1000;

let stopPolling: (() => void) | undefined;

const setPageHidden = (hidden: boolean): void => {
  Object.defineProperty(document, "hidden", {
    value: hidden,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

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

  // Plain tab switching must not cause request bursts
  test("does not load on resume while the last load is fresh", async () => {
    await start();
    setPageHidden(true);
    await vi.advanceTimersByTimeAsync(10_000);

    setPageHidden(false);
    await vi.advanceTimersByTimeAsync(0);

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

  // A failed boot load left no data, so the first foregrounding must retry
  // rather than wait for the next tick
  test("loads when a hidden page whose boot load failed is first shown", async () => {
    vi.mocked(loadData).mockResolvedValueOnce(false);
    setPageHidden(true);
    await start();
    expect(loadData).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10_000);
    setPageHidden(false);
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
