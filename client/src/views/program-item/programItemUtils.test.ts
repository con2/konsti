import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  getDirectSignupForSlot,
  getProgramItemValidity,
} from "client/views/program-item/programItemUtils";
import { SignupType } from "shared/types/models/programItem";

afterEach(() => {
  vi.restoreAllMocks();
});

test("program item with valid values passes all validity checks", () => {
  expect(getProgramItemValidity(testProgramItem)).toEqual({
    isValidMinAttendanceValue: true,
    isValidMaxAttendanceValue: true,
    minAttendanceBiggerThanMax: false,
    signupTypeMissing: false,
    allValuesValid: true,
  });
});

test("program item with missing signup type is invalid", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    signupType: SignupType.MISSING,
  });

  expect(validity.signupTypeMissing).toBe(true);
  expect(validity.allValuesValid).toBe(false);
});

test("program item with minAttendance 0 is invalid", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    minAttendance: 0,
  });

  expect(validity.isValidMinAttendanceValue).toBe(false);
  expect(validity.allValuesValid).toBe(false);
});

test("Konsti signup program item with maxAttendance 0 is invalid", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    maxAttendance: 0,
  });

  expect(validity.isValidMaxAttendanceValue).toBe(false);
  expect(validity.allValuesValid).toBe(false);
});

test("maxAttendance 0 is valid when signup is not handled by Konsti", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    signupType: SignupType.OTHER,
    maxAttendance: 0,
  });

  expect(validity.isValidMaxAttendanceValue).toBe(true);
  expect(validity.allValuesValid).toBe(true);
});

test("maxAttendance 0 is valid when program item is excluded from Konsti signup", () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    noKonstiSignupIds: [testProgramItem.programItemId],
  });

  const validity = getProgramItemValidity({
    ...testProgramItem,
    maxAttendance: 0,
  });

  expect(validity.isValidMaxAttendanceValue).toBe(true);
  expect(validity.allValuesValid).toBe(true);
});

test("program item with minAttendance bigger than maxAttendance is invalid", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    minAttendance: 5,
    maxAttendance: 4,
  });

  expect(validity.minAttendanceBiggerThanMax).toBe(true);
  expect(validity.allValuesValid).toBe(false);
});

test("minAttendance bigger than maxAttendance is not flagged when maxAttendance is 0", () => {
  // maxAttendance 0 is already reported by the max attendance check
  const validity = getProgramItemValidity({
    ...testProgramItem,
    minAttendance: 5,
    maxAttendance: 0,
  });

  expect(validity.minAttendanceBiggerThanMax).toBe(false);
  expect(validity.isValidMaxAttendanceValue).toBe(false);
  expect(validity.allValuesValid).toBe(false);
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
