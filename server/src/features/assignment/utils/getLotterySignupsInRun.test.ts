import { addMinutes } from "date-fns";
import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { LotterySignup } from "shared/types/models/user";
import {
  getLotterySignupsInRun,
  indexProgramItemsById,
} from "server/features/assignment/utils/getLotterySignupsInRun";

afterEach(() => {
  vi.resetAllMocks();
});

const parentStartTime = addMinutes(
  new Date(testProgramItem.startTime),
  30,
).toISOString();

const lotterySignupFor = (programItemId: string): LotterySignup => ({
  programItemId,
  priority: 1,
  signedToStartTime: testProgramItem.startTime,
});

const mockBatch = (parentId: string): void => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([[parentId, parentStartTime]]),
  });
};

test("picks the lottery sign-ups for the program items starting at the given time", () => {
  const later = {
    ...testProgramItem2,
    parentId: "",
    startTime: addMinutes(
      new Date(testProgramItem.startTime),
      60,
    ).toISOString(),
  };
  const signup = lotterySignupFor(testProgramItem.programItemId);

  const lotterySignupsInRun = getLotterySignupsInRun(
    [signup, lotterySignupFor(later.programItemId)],
    indexProgramItemsById([{ ...testProgramItem, parentId: "" }, later]),
    testProgramItem.startTime,
  );

  expect(lotterySignupsInRun).toEqual([signup]);
});

// The run allocates the whole batch, so a preference for one of its program items belongs to
// the run at the batch's time rather than the one at the program item's own
test("picks a batched lottery sign-up by the parent start time, not the own one", () => {
  mockBatch(testProgramItem.parentId);
  const signup = lotterySignupFor(testProgramItem.programItemId);

  const lotterySignupsInRun = getLotterySignupsInRun(
    [signup],
    indexProgramItemsById([testProgramItem]),
    parentStartTime,
  );

  expect(lotterySignupsInRun).toEqual([signup]);
});

test("leaves a batched lottery sign-up out of the run for the own start time", () => {
  mockBatch(testProgramItem.parentId);

  const lotterySignupsInRun = getLotterySignupsInRun(
    [lotterySignupFor(testProgramItem.programItemId)],
    indexProgramItemsById([testProgramItem]),
    testProgramItem.startTime,
  );

  expect(lotterySignupsInRun).toEqual([]);
});

test("falls back to the own start time when the parent has no override", () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map(),
  });
  const signup = lotterySignupFor(testProgramItem.programItemId);

  const lotterySignupsInRun = getLotterySignupsInRun(
    [signup],
    indexProgramItemsById([testProgramItem]),
    testProgramItem.startTime,
  );

  expect(lotterySignupsInRun).toEqual([signup]);
});

// The assigner rejects the whole input over a preference it has no event for, so a sign-up
// naming a program item the run does not know about is dropped rather than passed on
test("leaves out a lottery sign-up whose program item is not in the run", () => {
  const lotterySignupsInRun = getLotterySignupsInRun(
    [lotterySignupFor("unknown-program-item")],
    indexProgramItemsById([testProgramItem]),
    testProgramItem.startTime,
  );

  expect(lotterySignupsInRun).toEqual([]);
});
