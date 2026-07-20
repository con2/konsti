import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getDirectSignupForSlot } from "client/views/program-item/programItemUtils";

afterEach(() => {
  vi.restoreAllMocks();
});

test("matches a direct signup at the program item's own start time", () => {
  const directSignups = [
    { signedToStartTime: testProgramItem.startTime, programItemId: "other" },
  ];

  expect(getDirectSignupForSlot(directSignups, testProgramItem)).toEqual(
    directSignups[0],
  );
});

test("returns undefined when no direct signup occupies the slot", () => {
  const directSignups = [
    { signedToStartTime: "2019-07-26T20:00:00.000Z", programItemId: "other" },
  ];

  expect(
    getDirectSignupForSlot(directSignups, testProgramItem),
  ).toBeUndefined();
});

test("matches a direct signup stored at the parent-resolved start time", () => {
  // The lottery item is batched under a parent whose start time drives the lottery, so the
  // direct signup for the slot is stored at the parent time, not the item's own start time
  const parentStartTime = "2019-07-26T18:00:00.000Z";

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const directSignups = [
    { signedToStartTime: parentStartTime, programItemId: "other" },
  ];

  expect(getDirectSignupForSlot(directSignups, testProgramItem)).toEqual(
    directSignups[0],
  );
});
