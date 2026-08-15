// @vitest-environment node
import { ComponentType } from "react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { importWithRetry } from "client/utils/lazyWithRetry";

const pageForceRefreshedKey = "page-has-been-force-refreshed";

// Runs in the node environment with stubbed globals because jsdom's
// location.reload is unforgeable and cannot be mocked
const storage = new Map<string, string>();
const reloadMock = vi.fn();

beforeAll(() => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  vi.stubGlobal("location", { reload: reloadMock });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  storage.clear();
  reloadMock.mockClear();
});

const testComponent = { default: (() => null) as ComponentType };

const failingImport = (): Promise<{ default: ComponentType }> =>
  Promise.reject(new Error("Failed to fetch dynamically imported module"));

describe("importWithRetry", () => {
  test("returns the component and resets the refresh flag on success", async () => {
    storage.set(pageForceRefreshedKey, "true");

    const component = await importWithRetry(() =>
      Promise.resolve(testComponent),
    );

    expect(component).toBe(testComponent);
    expect(storage.get(pageForceRefreshedKey)).toEqual("false");
    expect(reloadMock).not.toHaveBeenCalled();
  });

  test("reloads the page on first failure without surfacing the error", async () => {
    const resultPromise = importWithRetry(failingImport);

    // Let the rejected import settle so the catch path runs
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(reloadMock).toHaveBeenCalledOnce();
    expect(storage.get(pageForceRefreshedKey)).toEqual("true");

    // The returned promise must stay pending so the error doesn't reach
    // Sentry while the page reloads
    const settle = async (): Promise<string> => {
      try {
        await resultPromise;
      } catch {
        // Either outcome counts as settling
      }
      return "settled";
    };
    const raceResult = await Promise.race([
      settle(),
      new Promise((resolve) => setTimeout(() => resolve("pending"), 50)),
    ]);
    expect(raceResult).toEqual("pending");
  });

  test("throws and keeps the flag set when the import fails again after a reload", async () => {
    storage.set(pageForceRefreshedKey, "true");

    await expect(importWithRetry(failingImport)).rejects.toThrow(
      "Failed to fetch dynamically imported module",
    );
    expect(reloadMock).not.toHaveBeenCalled();
    // Keeping the flag stops the next load reloading for the same broken
    // chunk all over again
    expect(storage.get(pageForceRefreshedKey)).toEqual("true");
  });
});
