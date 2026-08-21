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
import { browserStorageEventPrefix } from "shared/constants/browserStorage";
import { importWithRetry } from "client/utils/lazyWithRetry";

const chunkName = "TestView";
const retryKey = `${browserStorageEventPrefix}-chunk-retry-${chunkName}`;

// Runs in the node environment with stubbed globals because jsdom's
// location.reload is unforgeable and cannot be mocked
const storage = new Map<string, string>();
const reloadMock = vi.fn();

beforeAll(() => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
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
  test("returns the component and clears the retry flag on success", async () => {
    storage.set(retryKey, "true");

    const component = await importWithRetry(chunkName, () =>
      Promise.resolve(testComponent),
    );

    expect(component).toBe(testComponent);
    expect(storage.has(retryKey)).toEqual(false);
    expect(reloadMock).not.toHaveBeenCalled();
  });

  test("reloads the page on first failure without surfacing the error", async () => {
    const resultPromise = importWithRetry(chunkName, failingImport);

    // Let the rejected import settle so the catch path runs
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(reloadMock).toHaveBeenCalledOnce();
    expect(storage.get(retryKey)).toEqual("true");

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
    storage.set(retryKey, "true");

    await expect(importWithRetry(chunkName, failingImport)).rejects.toThrow(
      "Failed to fetch dynamically imported module",
    );
    expect(reloadMock).not.toHaveBeenCalled();
    // Keeping the flag stops the next load reloading for the same broken
    // chunk all over again
    expect(storage.get(retryKey)).toEqual("true");
  });
  // A shared flag made this reload forever: the app's own chunk succeeds on
  // every load and cleared it, so the broken view never got to throw
  test("one chunk succeeding does not clear another's retry flag", async () => {
    const brokenPromise = importWithRetry(chunkName, failingImport);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(reloadMock).toHaveBeenCalledOnce();

    // Stands in for the page reloading and the app's own chunk loading fine
    await importWithRetry("App", () => Promise.resolve(testComponent));

    // The broken chunk still has to throw rather than reload a second time
    await expect(importWithRetry(chunkName, failingImport)).rejects.toThrow(
      "Failed to fetch dynamically imported module",
    );
    expect(reloadMock).toHaveBeenCalledOnce();

    void brokenPromise;
  });
});
