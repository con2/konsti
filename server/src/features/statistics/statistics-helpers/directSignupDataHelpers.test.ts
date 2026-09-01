import { beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramType, State } from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { printRpgDirectSignupFullTimes } from "server/features/statistics/statistics-helpers/directSignupDataHelpers";
import { logger } from "server/utils/logger";

// Rolling direct sign-up opens 4 hours before the program item starts, so with an
// event starting Fri 15:00 GMT+3 an item at Sat 20:00 opens at Sat 16:00 GMT+3
const EVENT_START = "2023-07-28T12:00:00Z";
const ITEM_START = "2023-07-29T17:00:00.000Z"; // Sat 20:00 GMT+3
const SIGNUP_OPENS = "2023-07-29T13:00:00.000Z"; // Sat 16:00 GMT+3

const programItem = {
  ...testProgramItem,
  programType: ProgramType.TABLETOP_RPG,
  startTime: ITEM_START,
  maxAttendance: 4,
  title: "Test RPG",
};

const directSignup = (
  updatedAt: string,
  userCount = 2,
): DirectSignupsForProgramItem & { updatedAt: string } => ({
  programItemId: programItem.programItemId,
  count: userCount,
  updatedAt,
  userSignups: Array.from({ length: userCount }, (_, index) => ({
    username: `user${index}`,
    priority: 0,
    signedToStartTime: ITEM_START,
    signupTime: updatedAt,
    message: "",
  })),
});

const infoLines = (): string[] =>
  vi
    .mocked(logger.info)
    .mock.calls.map((call) => call[0])
    .filter((arg) => typeof arg === "string");

beforeEach(() => {
  vi.mocked(logger.info).mockClear();
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventStartTime: EVENT_START,
    enableRollingDirectSignupPreviousDay: true,
    rollingDirectSignupEarliestStartTime: null,
    rollingDirectSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });
});

// The elapsed time is measured against the sign-up opening, reported in
// seconds under a minute and as h/min above it
test.each([
  ["2023-07-29T13:00:45.000Z", "45s (2/4) - Test RPG"],
  ["2023-07-29T13:01:00.000Z", "60s (2/4) - Test RPG"],
  ["2023-07-29T13:07:00.000Z", "7min (2/4) - Test RPG"],
  ["2023-07-29T14:30:00.000Z", "1h30min (2/4) - Test RPG"],
  ["2023-07-29T16:00:00.000Z", "3h0min (2/4) - Test RPG"],
])("signup filled at %s is reported as '%s'", (updatedAt, expected) => {
  printRpgDirectSignupFullTimes([directSignup(updatedAt)], [programItem]);
  expect(infoLines()).toContain(expected);
});

test("reports the direct sign-up opening time used as the baseline", () => {
  printRpgDirectSignupFullTimes([directSignup(SIGNUP_OPENS)], [programItem]);
  expect(infoLines()).toContain("0s (2/4) - Test RPG");
});

test("skips cancelled program items", () => {
  printRpgDirectSignupFullTimes(
    [directSignup("2023-07-29T14:30:00.000Z")],
    [{ ...programItem, state: State.CANCELLED }],
  );
  expect(infoLines()).not.toContain("1h30min (2/4) - Test RPG");
});

test("ignores direct sign-ups for non-RPG program items", () => {
  printRpgDirectSignupFullTimes(
    [directSignup("2023-07-29T14:30:00.000Z")],
    [{ ...programItem, programType: ProgramType.WORKSHOP }],
  );
  expect(infoLines()).toContain(
    "Loaded direct signups for 0 RPG program items",
  );
});
