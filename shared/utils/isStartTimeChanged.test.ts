import { beforeEach, describe, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import { config } from "shared/config";
import { isStartTimeChanged } from "shared/utils/isStartTimeChanged";

const parentId = "test-parent-id";
const parentStartTime = "2023-07-29T12:00:00.000Z";

describe("isStartTimeChanged with parent start time override", () => {
  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map([[parentId, parentStartTime]]),
    });
  });

  test("returns false when signedToStartTime matches the parent start time", () => {
    // Own start time differs, but the parent override is what matters
    const result = isStartTimeChanged(
      parentStartTime,
      "2023-07-29T15:00:00.000Z",
      parentId,
    );
    expect(result).toEqual(false);
  });

  test("returns true when signedToStartTime differs from the parent start time", () => {
    const result = isStartTimeChanged(
      "2023-07-29T13:30:00.000Z",
      parentStartTime,
      parentId,
    );
    expect(result).toEqual(true);
  });

  test("ignores own start time match when a parent override exists", () => {
    const ownStartTime = "2023-07-29T15:00:00.000Z";
    // signedToStartTime equals own start time but not the parent start time
    const result = isStartTimeChanged(ownStartTime, ownStartTime, parentId);
    expect(result).toEqual(true);
  });
});

describe("isStartTimeChanged without parent start time override", () => {
  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map(),
    });
  });

  test("returns false when signedToStartTime matches the program item start time", () => {
    const startTime = "2023-07-29T15:00:00.000Z";
    const result = isStartTimeChanged(startTime, startTime, parentId);
    expect(result).toEqual(false);
  });

  test("returns true when signedToStartTime differs from the program item start time", () => {
    const result = isStartTimeChanged(
      dayjs("2023-07-29T15:00:00.000Z").add(1, "hour").toISOString(),
      "2023-07-29T15:00:00.000Z",
      parentId,
    );
    expect(result).toEqual(true);
  });

  test("ignores sub-minute differences in the program item start time", () => {
    const result = isStartTimeChanged(
      "2023-07-29T15:00:00.000Z",
      "2023-07-29T15:00:30.000Z",
      parentId,
    );
    expect(result).toEqual(false);
  });
});
