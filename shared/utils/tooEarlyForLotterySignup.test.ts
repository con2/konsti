import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { tooEarlyForLotterySignup } from "shared/utils/tooEarlyForLotterySignup";

const eventStartTime = "2019-07-26T13:00:00.000Z";

afterEach(() => {
  vi.restoreAllMocks();
});

const mockEvent = (
  startTimesByParentIds: Map<string, string> = new Map(),
): void => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventStartTime,
    startTimesByParentIds,
  });
};

test("is too early within the first three hours of the event", () => {
  mockEvent();
  // The item starts right at the 13:00 event start, so before the 16:00 lottery cutoff
  const programItem = { ...testProgramItem, startTime: eventStartTime };
  expect(tooEarlyForLotterySignup(programItem)).toEqual(true);
});

test("is not too early once past the first three hours", () => {
  mockEvent();
  const programItem = {
    ...testProgramItem,
    startTime: "2019-07-26T17:00:00.000Z",
  };
  expect(tooEarlyForLotterySignup(programItem)).toEqual(false);
});

test("uses the parent-resolved start time when the item is parent-batched", () => {
  // Own start time (14:00) is within the first three hours (before 16:00), but the parent
  // start time (18:00) that actually drives the lottery is past the cutoff
  mockEvent(new Map([[testProgramItem.parentId, "2019-07-26T18:00:00.000Z"]]));
  expect(tooEarlyForLotterySignup(testProgramItem)).toEqual(false);
});
