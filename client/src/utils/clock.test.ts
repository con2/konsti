import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const CLOCK_TICK_MS = 60 * 1000;

// The clock is module state shared by the whole app, so each test gets its own
// copy of the module - imported under fake timers, so even the instant it
// captures at load time is deterministic
let clock: typeof import("client/utils/clock");
let unsubscribes: (() => void)[] = [];

const subscribe = (listener: () => void): (() => void) => {
  const unsubscribe = clock.subscribeToClock(listener);
  unsubscribes.push(unsubscribe);
  return unsubscribe;
};

const setPageHidden = (hidden: boolean): void => {
  Object.defineProperty(document, "hidden", {
    value: hidden,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

beforeEach(async () => {
  // Start on a minute boundary so "half a tick" is unambiguous
  vi.useFakeTimers({ now: new Date("2026-08-16T12:00:00.000Z") });
  vi.resetModules();
  clock = await import("client/utils/clock");
  unsubscribes = [];
});

afterEach(() => {
  for (const unsubscribe of unsubscribes) {
    unsubscribe();
  }
  setPageHidden(false);
  vi.useRealTimers();
});

describe("clock", () => {
  // The snapshot is what React caches a render against, so a value that never
  // changes is a clock frozen at whatever instant a component first rendered
  test("hands out the same instant until the clock ticks", () => {
    subscribe(vi.fn());

    const first = clock.getTimeNowSnapshot();
    vi.advanceTimersByTime(CLOCK_TICK_MS - 1);
    expect(clock.getTimeNowSnapshot()).toEqual(first);

    vi.advanceTimersByTime(1);
    expect(clock.getTimeNowSnapshot()).toEqual(first + CLOCK_TICK_MS);
  });

  // Every client crossing a sign-up boundary at the same moment is what keeps
  // a first-come-first-served race fair, so the tick follows the wall clock
  // rather than the moment the page happened to subscribe
  test("ticks on the wall-clock minute rather than a subscription-relative one", () => {
    // 20s past the minute, so the two schedules can be told apart
    vi.advanceTimersByTime(20_000);
    const listener = vi.fn();
    subscribe(listener);

    vi.advanceTimersByTime(40_000 - 1);
    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(clock.getTimeNowSnapshot() % CLOCK_TICK_MS).toEqual(0);

    // Where a tick scheduled a full period after subscribing would have landed
    vi.advanceTimersByTime(20_000);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("notifies every subscriber on a tick", () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribe(first);
    subscribe(second);

    vi.advanceTimersByTime(CLOCK_TICK_MS);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("stops ticking once the last subscriber leaves", () => {
    const listener = vi.fn();
    subscribe(listener)();

    const afterUnsubscribe = clock.getTimeNowSnapshot();
    vi.advanceTimersByTime(CLOCK_TICK_MS * 5);

    expect(listener).not.toHaveBeenCalled();
    expect(clock.getTimeNowSnapshot()).toEqual(afterUnsubscribe);
  });

  // Time passed while nobody was subscribed, so the first read after
  // resubscribing must not hand back the instant the clock stopped at
  test("catches the clock up when it is subscribed to again", () => {
    subscribe(vi.fn())();
    const stoppedAt = clock.getTimeNowSnapshot();

    vi.advanceTimersByTime(CLOCK_TICK_MS * 5);
    subscribe(vi.fn());

    expect(clock.getTimeNowSnapshot()).toEqual(stoppedAt + 5 * CLOCK_TICK_MS);
  });

  // Subscribing happens in an effect right after the first render read the
  // snapshot, so catching up there would hand every consumer a second,
  // pointlessly different instant and render the whole app twice on boot
  test("does not move the clock when subscribed to within the same tick", () => {
    const before = clock.getTimeNowSnapshot();
    vi.advanceTimersByTime(CLOCK_TICK_MS - 1);
    subscribe(vi.fn());

    expect(clock.getTimeNowSnapshot()).toEqual(before);
  });

  // A frozen page (screen off, background tab) runs no timers at all, so
  // without this the app renders freshly polled data against a pre-sleep
  // instant for as long as it takes the overdue timer to fire
  test("resyncs when the page resumes from being hidden", () => {
    const listener = vi.fn();
    subscribe(listener);
    const beforeSleep = clock.getTimeNowSnapshot();

    setPageHidden(true);
    // A frozen page's timers don't run, so move time without running them
    const sleepMs = 60 * CLOCK_TICK_MS;
    vi.setSystemTime(Date.now() + sleepMs);
    expect(clock.getTimeNowSnapshot()).toEqual(beforeSleep);

    setPageHidden(false);

    expect(clock.getTimeNowSnapshot()).toEqual(beforeSleep + sleepMs);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
