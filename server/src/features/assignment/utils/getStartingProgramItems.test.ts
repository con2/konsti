import { addMinutes } from "date-fns";
import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";

afterEach(() => {
  vi.resetAllMocks();
});

const parentStartTime = addMinutes(
  new Date(testProgramItem.startTime),
  30,
).toISOString();

test("picks the program items starting at the given time", () => {
  const later = {
    ...testProgramItem2,
    parentId: "",
    startTime: addMinutes(
      new Date(testProgramItem.startTime),
      60,
    ).toISOString(),
  };

  const startingProgramItems = getStartingProgramItems(
    [{ ...testProgramItem, parentId: "" }, later],
    testProgramItem.startTime,
  );

  expect(
    startingProgramItems.map((programItem) => programItem.programItemId),
  ).toEqual([testProgramItem.programItemId]);
});

// The override batches several own start times into one lottery, so the batch's time is what
// decides which run a program item belongs to
test("picks a batched program item by its parent start time, not its own", () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const startingProgramItems = getStartingProgramItems(
    [testProgramItem],
    parentStartTime,
  );

  expect(
    startingProgramItems.map((programItem) => programItem.programItemId),
  ).toEqual([testProgramItem.programItemId]);
});

test("leaves a batched program item out of the run for its own start time", () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const startingProgramItems = getStartingProgramItems(
    [testProgramItem],
    testProgramItem.startTime,
  );

  expect(startingProgramItems).toEqual([]);
});

test("falls back to the own start time when the parent has no override", () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map(),
  });

  const startingProgramItems = getStartingProgramItems(
    [testProgramItem],
    testProgramItem.startTime,
  );

  expect(
    startingProgramItems.map((programItem) => programItem.programItemId),
  ).toEqual([testProgramItem.programItemId]);
});

// Program items in one batch start at different times but share a lottery
test("picks every program item in a batch, whatever their own start times", () => {
  const parentId = testProgramItem.parentId;
  const laterInSameBatch = {
    ...testProgramItem2,
    parentId,
    startTime: addMinutes(
      new Date(testProgramItem.startTime),
      60,
    ).toISOString(),
  };

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([[parentId, parentStartTime]]),
  });

  const startingProgramItems = getStartingProgramItems(
    [testProgramItem, laterInSameBatch],
    parentStartTime,
  );

  expect(
    startingProgramItems.map((programItem) => programItem.programItemId),
  ).toEqual([testProgramItem.programItemId, testProgramItem2.programItemId]);
});
