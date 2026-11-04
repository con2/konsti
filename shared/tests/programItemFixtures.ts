import { addHours, addMinutes, isAfter, startOfHour } from "date-fns";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramItem } from "shared/types/models/programItem";

// Program item fixtures placed relative to the event's own timing, for the
// Playwright specs and the real-device checks alike

// The moment the test suites treat as the start of the event: every mocked
// clock and every program item start time is built from this. It is the event
// start unless the event holds direct sign-up back past it, because a test
// starting its clock before direct sign-up opens has nothing to sign up to.
export const signupsOpenTime = (): string => {
  const { eventStartTime, rollingDirectSignupEarliestStartTime } =
    config.event();

  return rollingDirectSignupEarliestStartTime &&
    isAfter(
      new Date(rollingDirectSignupEarliestStartTime),
      new Date(eventStartTime),
    )
    ? rollingDirectSignupEarliestStartTime
    : eventStartTime;
};

// Program item start times, built relative to the event start so a test never
// pins an absolute date. Truncated to a whole hour because lottery items are
// only valid on one, and the hour is the event's own: the Playwright and
// BrowserStack test configs pin the process to that timezone.
export const hoursIntoEvent = (hours: number): string => {
  return startOfHour(
    addHours(new Date(signupsOpenTime()), hours),
  ).toISOString();
};

// When a program item starting at the given time ends, keeping the length of the fixture, the
// first test program item unless another is given
export const endTimeFor = (
  startTime: string,
  programItem: ProgramItem = testProgramItem,
): string => {
  return addMinutes(new Date(startTime), programItem.mins).toISOString();
};

// A fixture as a lottery program item at the given start time, the first test program item
// unless another is given
export const twoPhaseProgramItem = (
  startTime: string,
  {
    programItem = testProgramItem,
    ...overrides
  }: Omit<Partial<ProgramItem>, "startTime" | "endTime"> & {
    programItem?: ProgramItem;
  } = {},
): ProgramItem => {
  const lotteryProgramItem = {
    ...programItem,
    programType: config.event().twoPhaseSignupProgramTypes[0],
    startTime,
    ...overrides,
  };
  return {
    ...lotteryProgramItem,
    endTime: endTimeFor(startTime, lotteryProgramItem),
  };
};
