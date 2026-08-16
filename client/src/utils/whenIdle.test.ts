// @vitest-environment node
import { afterEach, describe, expect, test, vi } from "vitest";
import { whenIdle } from "client/utils/whenIdle";

// Every browser the test suite runs in has requestIdleCallback, so the timer
// fallback is only ever exercised here - it ships to older Safari untested
// otherwise

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("whenIdle", () => {
  test("defers the task to requestIdleCallback where it exists", () => {
    const task = vi.fn();
    let idleTask: (() => void) | undefined;
    vi.stubGlobal("requestIdleCallback", (callback: () => void): number => {
      idleTask = callback;
      return 1;
    });

    whenIdle(task);

    expect(task).not.toHaveBeenCalled();

    idleTask?.();

    expect(task).toHaveBeenCalledOnce();
  });

  test("cancels a pending idle callback by its handle", () => {
    const cancelIdleCallback = vi.fn();
    vi.stubGlobal("requestIdleCallback", (): number => 42);
    vi.stubGlobal("cancelIdleCallback", cancelIdleCallback);

    const cancel = whenIdle(vi.fn());
    cancel();

    expect(cancelIdleCallback).toHaveBeenCalledWith(42);
  });

  test("falls back to a timer where requestIdleCallback is missing", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    const task = vi.fn();

    whenIdle(task);

    // Deferred rather than run inline, which is the whole point of the helper
    expect(task).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(task).toHaveBeenCalledOnce();
  });

  test("cancels the fallback timer so the task never runs", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    const task = vi.fn();

    const cancel = whenIdle(task);
    cancel();
    vi.runAllTimers();

    expect(task).not.toHaveBeenCalled();
  });
});
