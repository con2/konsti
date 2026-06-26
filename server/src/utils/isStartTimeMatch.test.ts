import { beforeEach, describe, expect, test, vi } from "vitest";
import { isStartTimeMatch } from "server/utils/isStartTimeMatch";
import { config } from "shared/config";

const parentId = "test-parent-id";
const parentStartTime = "2023-07-29T12:00:00.000Z";
const ownStartTime = "2023-07-29T15:00:00.000Z";

describe("isStartTimeMatch without parentId", () => {
  test("returns true when start time matches", () => {
    expect(isStartTimeMatch(ownStartTime, ownStartTime, undefined)).toEqual(
      true,
    );
  });

  test("returns false when start time does not match", () => {
    expect(isStartTimeMatch(ownStartTime, parentStartTime, undefined)).toEqual(
      false,
    );
  });
});

describe("isStartTimeMatch with parent start time override", () => {
  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map([[parentId, parentStartTime]]),
    });
  });

  test("matches against the parent start time, ignoring own start time", () => {
    // timeToMatch equals the parent start time, own start time differs
    expect(isStartTimeMatch(ownStartTime, parentStartTime, parentId)).toEqual(
      true,
    );
  });

  test("returns false when own start time matches but parent start time does not", () => {
    // timeToMatch equals own start time, but the parent override is used instead
    expect(isStartTimeMatch(ownStartTime, ownStartTime, parentId)).toEqual(
      false,
    );
  });
});

describe("isStartTimeMatch with parentId not in override map", () => {
  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map(),
    });
  });

  test("falls back to own start time comparison", () => {
    expect(isStartTimeMatch(ownStartTime, ownStartTime, parentId)).toEqual(
      true,
    );
    expect(isStartTimeMatch(ownStartTime, parentStartTime, parentId)).toEqual(
      false,
    );
  });
});
