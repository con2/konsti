import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { EventConfig } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  ProgramItem,
  ProgramType,
  SignupType,
  Tag,
} from "shared/types/models/programItem";
import { getProgramItemValidity } from "shared/utils/getProgramItemValidity";

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

test("program item with missing sign-up type is invalid", () => {
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

test("Konsti sign-up program item with maxAttendance 0 is invalid", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    maxAttendance: 0,
  });

  expect(validity.isValidMaxAttendanceValue).toBe(false);
  expect(validity.allValuesValid).toBe(false);
});

test("maxAttendance 0 is valid when sign-up is not handled by Konsti", () => {
  const validity = getProgramItemValidity({
    ...testProgramItem,
    signupType: SignupType.OTHER,
    maxAttendance: 0,
  });

  expect(validity.isValidMaxAttendanceValue).toBe(true);
  expect(validity.allValuesValid).toBe(true);
});

test("maxAttendance 0 is valid when program item is excluded from Konsti sign-up", () => {
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

describe("Program item starting at half hour", () => {
  const halfHourStart = "2019-07-26T14:30:00.000Z";
  const evenHourStart = "2019-07-26T14:00:00.000Z";

  interface HalfHourCase {
    case: string;
    programItem?: Partial<ProgramItem>;
    eventConfig?: Partial<EventConfig>;
    invalid: boolean;
  }

  test.each<HalfHourCase>([
    {
      case: "lottery program item is invalid",
      eventConfig: {
        twoPhaseSignupProgramTypes: [testProgramItem.programType],
      },
      invalid: true,
    },
    {
      case: "direct sign-up program item is valid",
      programItem: { programType: ProgramType.TOURNAMENT },
      invalid: false,
    },
    {
      case: "lottery program item without Konsti sign-up is valid",
      programItem: { signupType: SignupType.OTHER },
      invalid: false,
    },
    {
      case: "pre-convention week program item is valid",
      programItem: { tags: [Tag.PRE_CONVENTION_WEEK] },
      invalid: false,
    },
    {
      case: "lottery program item is valid when its parent start time is at even hour",
      eventConfig: {
        startTimesByParentIds: new Map([
          [testProgramItem.parentId, evenHourStart],
        ]),
      },
      invalid: false,
    },
    {
      case: "lottery program item is valid when its parent start time is at half hour",
      eventConfig: {
        startTimesByParentIds: new Map([
          [testProgramItem.parentId, halfHourStart],
        ]),
      },
      invalid: false,
    },
    {
      case: "lottery program item is invalid when its parentId has no configured start time",
      eventConfig: {
        twoPhaseSignupProgramTypes: [testProgramItem.programType],
        startTimesByParentIds: new Map([["other-parent", evenHourStart]]),
      },
      invalid: true,
    },
  ])("$case", ({ programItem, eventConfig, invalid }) => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      ...eventConfig,
    });

    const validity = getProgramItemValidity({
      ...testProgramItem,
      startTime: halfHourStart,
      ...programItem,
    });

    expect(validity.lotteryItemNotStartingOnEvenHour).toBe(invalid);
    expect(validity.allValuesValid).toBe(!invalid);
  });
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
