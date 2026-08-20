import { beforeEach, expect, test, vi } from "vitest";
import {
  getCurrentLocale,
  getLocaleSnapshot,
  setLocale,
  subscribeToLocale,
} from "shared/utils/setLocale";

beforeEach(() => {
  setLocale("en");
});

test("switching language notifies subscribers", () => {
  const listener = vi.fn();
  subscribeToLocale(listener);

  setLocale("fi");

  expect(listener).toHaveBeenCalledTimes(1);
});

// The snapshot backs useSyncExternalStore, which re-reads it after every render
// and loops if an unchanged language hands back something new
test("hands out the same snapshot until the language changes", () => {
  const first = getLocaleSnapshot();
  setLocale("en");
  expect(getLocaleSnapshot()).toEqual(first);

  setLocale("fi");
  expect(getLocaleSnapshot()).toEqual("fi");
});

// Re-selecting the current language would otherwise re-render every consumer
test("does not notify when the language is unchanged", () => {
  const listener = vi.fn();
  subscribeToLocale(listener);

  setLocale("en");

  expect(listener).not.toHaveBeenCalled();
});

test("stops notifying after unsubscribe", () => {
  const listener = vi.fn();
  const unsubscribe = subscribeToLocale(listener);
  unsubscribe();

  setLocale("fi");

  expect(listener).not.toHaveBeenCalled();
});

test("an unknown language falls back to English", () => {
  setLocale("de");
  expect(getCurrentLocale().code).toEqual("en-US");
});
