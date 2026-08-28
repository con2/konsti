import { addHours, addMinutes } from "date-fns";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { isStartTimeChanged } from "shared/utils/isStartTimeChanged";

const startTime = "2023-07-29T15:00:00.000Z";

describe("isStartTimeChanged", () => {
  test("returns false when the sign-up records the program item's start time", () => {
    expect(isStartTimeChanged(startTime, startTime)).toEqual(false);
  });

  test("returns true when the program item has moved", () => {
    expect(
      isStartTimeChanged(
        addHours(new Date(startTime), 1).toISOString(),
        startTime,
      ),
    ).toEqual(true);
  });

  test("ignores sub-minute differences in the program item start time", () => {
    expect(isStartTimeChanged(startTime, "2023-07-29T15:00:30.000Z")).toEqual(
      false,
    );
  });

  test("reports a change when either time cannot be read", () => {
    expect(isStartTimeChanged("not a time", startTime)).toEqual(true);
    expect(isStartTimeChanged(startTime, "not a time")).toEqual(true);
  });
});

// The parent batches a lottery; it says nothing about when an attendee turns up, so a sign-up
// in a batched program item still reports a move of that program item's own start time
describe("isStartTimeChanged for a batched program item", () => {
  const parentStartTime = addMinutes(new Date(startTime), 30).toISOString();

  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map([
        [testProgramItem.parentId, parentStartTime],
      ]),
    });
  });

  test("ignores the parent start time when nothing moved", () => {
    expect(isStartTimeChanged(startTime, startTime)).toEqual(false);
  });

  test("reports a move of the program item's own start time", () => {
    expect(
      isStartTimeChanged(
        startTime,
        addHours(new Date(startTime), 1).toISOString(),
      ),
    ).toEqual(true);
  });
});
