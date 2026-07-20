import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getProgramItemValidity } from "shared/utils/getProgramItemValidity";
import { ProgramType, SignupType, Tag } from "shared/types/models/programItem";

afterEach(() => {
  vi.restoreAllMocks();
});

test("program item with valid values passes all validity checks", () => {
  expect(getProgramItemValidity(testProgramItem)).toEqual({
    isValidMinAttendanceValue: true,
    isValidMaxAttendanceValue: true,
    minAttendanceBiggerThanMax: false,
    signupTypeMissing: false,
    lotteryItemNotStartingOnEvenHour: false,
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

test("lottery program item not starting at even hour is invalid", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    startTime: "2019-07-26T14:30:00.000Z",
  });

  expect(validity.lotteryItemNotStartingOnEvenHour).toBe(true);
  expect(validity.allValuesValid).toBe(false);
});

test("direct signup program item can start at half hour", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    programType: ProgramType.TOURNAMENT,
    startTime: "2019-07-26T14:30:00.000Z",
  });

  expect(validity.lotteryItemNotStartingOnEvenHour).toBe(false);
  expect(validity.allValuesValid).toBe(true);
});

test("lottery program item without Konsti signup can start at half hour", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    signupType: SignupType.OTHER,
    startTime: "2019-07-26T14:30:00.000Z",
  });

  expect(validity.lotteryItemNotStartingOnEvenHour).toBe(false);
  expect(validity.allValuesValid).toBe(true);
});

test("pre-convention week program item can start at half hour", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    tags: [Tag.PRE_CONVENTION_WEEK],
    startTime: "2019-07-26T14:30:00.000Z",
  });

  expect(validity.lotteryItemNotStartingOnEvenHour).toBe(false);
  expect(validity.allValuesValid).toBe(true);
});

test("lottery program item can start at half hour when parent start time is at even hour", () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, "2019-07-26T14:00:00.000Z"],
    ]),
  });

  const validity = getProgramItemValidity({
    ...testProgramItem,
    startTime: "2019-07-26T14:30:00.000Z",
  });

  expect(validity.lotteryItemNotStartingOnEvenHour).toBe(false);
  expect(validity.allValuesValid).toBe(true);
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
