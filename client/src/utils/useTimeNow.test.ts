import { beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { shouldUseTestTime } from "client/utils/useTimeNow";

const stubClientConfig = (
  loadedSettings: string,
  showTestValues: boolean,
): void => {
  vi.spyOn(config, "client").mockReturnValue({
    ...config.client(),
    loadedSettings,
    showTestValues,
  });
};

beforeEach(() => {
  vi.restoreAllMocks();
});

test("uses the mocked time when test values are on outside production", () => {
  stubClientConfig("development", true);
  expect(shouldUseTestTime("2026-07-25T12:00:00Z")).toEqual(true);
});

// An unset mocked time must fall back to the real clock rather than being parsed:
// an invalid date compares false against everything, so every sign-up window would
// silently look closed
test.each([[""], [null]])(
  "falls back to the real time when the mocked time is %p",
  (testTime) => {
    stubClientConfig("development", true);
    expect(shouldUseTestTime(testTime)).toEqual(false);
  },
);

test("never uses the mocked time in production", () => {
  stubClientConfig("production", true);
  expect(shouldUseTestTime("2026-07-25T12:00:00Z")).toEqual(false);
});

test("never uses the mocked time when test values are off", () => {
  stubClientConfig("development", false);
  expect(shouldUseTestTime("2026-07-25T12:00:00Z")).toEqual(false);
});
