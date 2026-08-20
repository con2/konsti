import { beforeEach, expect, test, vi } from "vitest";
import { Locale } from "shared/types/locale";
import {
  getLocaleSnapshot,
  setLocale,
  subscribeToLocale,
} from "shared/utils/setLocale";

beforeEach(() => {
  setLocale(Locale.EN);
});

test("switching language notifies subscribers", () => {
  const listener = vi.fn();
  subscribeToLocale(listener);

  setLocale(Locale.FI);

  expect(listener).toHaveBeenCalledTimes(1);
});

// The snapshot backs useSyncExternalStore, which re-reads it after every render
// and loops if an unchanged language hands back something new
test("hands out the same snapshot until the language changes", () => {
  const first = getLocaleSnapshot();
  setLocale(Locale.EN);
  expect(getLocaleSnapshot()).toEqual(first);

  setLocale(Locale.FI);
  expect(getLocaleSnapshot()).toEqual("fi");
});

// Re-selecting the current language would otherwise re-render every consumer
test("does not notify when the language is unchanged", () => {
  const listener = vi.fn();
  subscribeToLocale(listener);

  setLocale(Locale.EN);

  expect(listener).not.toHaveBeenCalled();
});

test("stops notifying after unsubscribe", () => {
  const listener = vi.fn();
  const unsubscribe = subscribeToLocale(listener);
  unsubscribe();

  setLocale(Locale.FI);

  expect(listener).not.toHaveBeenCalled();
});
