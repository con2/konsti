import { afterEach, describe, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import { config } from "shared/config";
import { isMainEventProgramVisible } from "client/utils/getUpcomingProgramItems";

const mainEventProgramVisibleTime = "2026-07-23T17:00:00Z";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isMainEventProgramVisible", () => {
  test("returns false before the main event program visible time", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      mainEventProgramVisibleTime,
    });
    const timeNow = dayjs(mainEventProgramVisibleTime).subtract(1, "minute");
    expect(isMainEventProgramVisible(timeNow)).toEqual(false);
  });

  test("returns true at the main event program visible time", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      mainEventProgramVisibleTime,
    });
    const timeNow = dayjs(mainEventProgramVisibleTime);
    expect(isMainEventProgramVisible(timeNow)).toEqual(true);
  });

  test("returns true when no main event program visible time is configured", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      mainEventProgramVisibleTime: null,
    });
    expect(isMainEventProgramVisible(dayjs("2020-01-01T00:00:00Z"))).toEqual(
      true,
    );
  });
});
