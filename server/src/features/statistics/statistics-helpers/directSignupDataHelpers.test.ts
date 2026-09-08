import { beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  printDirectSignupFillTimes,
  printProgramItemSignups,
} from "server/features/statistics/statistics-helpers/directSignupDataHelpers";
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
  signupTime: string,
  userCount = 2,
): DirectSignupsForProgramItem => ({
  programItemId: programItem.programItemId,
  count: userCount,
  userSignups: Array.from({ length: userCount }, (_, index) => ({
    username: `user${index}`,
    priority: 0,
    signedToStartTime: ITEM_START,
    signupTime,
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
    rollingDirectSignupProgramTypes: [
      ProgramType.TABLETOP_RPG,
      ProgramType.WORKSHOP,
    ],
    twoPhaseSignupProgramTypes: [ProgramType.FLEAMARKET],
  });
});

// The elapsed time is measured against the sign-up opening, reported in
// seconds under a minute and as h/min above it
test.each([
  ["2023-07-29T13:00:45.000Z", "  45s (2/4) - Test RPG"],
  ["2023-07-29T13:01:00.000Z", "  60s (2/4) - Test RPG"],
  ["2023-07-29T13:07:00.000Z", "  7min (2/4) - Test RPG"],
  ["2023-07-29T14:30:00.000Z", "  1h30min (2/4) - Test RPG"],
  ["2023-07-29T16:00:00.000Z", "  3h0min (2/4) - Test RPG"],
])("signup filled at %s is reported as '%s'", (signupTime, expected) => {
  printDirectSignupFillTimes([directSignup(signupTime)], [programItem]);
  expect(infoLines()).toContain(expected);
});

test("measures the fill time from the latest direct sign-up", () => {
  const first = directSignup("2023-07-29T13:07:00.000Z", 1);
  const second = directSignup("2023-07-29T14:30:00.000Z", 1);
  printDirectSignupFillTimes(
    [
      {
        ...first,
        count: 2,
        userSignups: [...second.userSignups, ...first.userSignups],
      },
    ],
    [programItem],
  );
  expect(infoLines()).toContain("  1h30min (2/4) - Test RPG");
});

const signupsAt = (signupTimes: string[]): DirectSignupsForProgramItem => ({
  programItemId: programItem.programItemId,
  count: signupTimes.length,
  userSignups: signupTimes.map((signupTime, index) => ({
    username: `user${index}`,
    priority: 0,
    signedToStartTime: ITEM_START,
    signupTime,
    message: "",
  })),
});

// Three sign-ups within seconds and a fourth hours later reads as a refill
// after a drop, which one figure for the last sign-up would hide
test("shows the time to one spot short of full beside the last sign-up", () => {
  printDirectSignupFillTimes(
    [
      signupsAt([
        "2023-07-29T13:00:05.000Z",
        "2023-07-29T13:00:14.000Z",
        "2023-07-29T13:00:09.000Z",
        "2023-07-29T16:18:00.000Z",
      ]),
    ],
    [programItem],
  );
  expect(infoLines()).toContain(
    "  14s for 3 spots, 3h18min for 4 spots (4/4) - Test RPG",
  );
});

// The last sign-up came a minute after the one before, which is how a program
// item filling steadily looks, so the earlier figure would only add noise
test("shows one figure when the last sign-up came soon after the one before", () => {
  printDirectSignupFillTimes(
    [
      signupsAt([
        "2023-07-29T13:10:00.000Z",
        "2023-07-29T13:20:00.000Z",
        "2023-07-29T13:41:00.000Z",
        "2023-07-29T13:42:00.000Z",
      ]),
    ],
    [programItem],
  );
  expect(infoLines()).toContain("  42min (4/4) - Test RPG");
});

test("shows one figure while the program item is short of full", () => {
  printDirectSignupFillTimes(
    [
      signupsAt([
        "2023-07-29T13:00:05.000Z",
        "2023-07-29T13:00:14.000Z",
        "2023-07-29T16:18:00.000Z",
      ]),
    ],
    [programItem],
  );
  expect(infoLines()).toContain("  3h18min (3/4) - Test RPG");
});

test("reports a program item nobody signed up for without a fill time", () => {
  printDirectSignupFillTimes([], [programItem]);
  expect(infoLines()).toContain("  no sign-ups (0/4) - Test RPG");
});

test("reports the direct sign-up opening time used as the baseline", () => {
  printDirectSignupFillTimes([directSignup(SIGNUP_OPENS)], [programItem]);
  expect(infoLines()).toContain("  0s (2/4) - Test RPG");
});

test("skips cancelled program items", () => {
  printDirectSignupFillTimes(
    [directSignup("2023-07-29T14:30:00.000Z")],
    [{ ...programItem, state: State.CANCELLED }],
  );
  expect(infoLines()).toEqual([]);
});

test("skips program items without Konsti sign-up", () => {
  printDirectSignupFillTimes(
    [directSignup("2023-07-29T14:30:00.000Z")],
    [{ ...programItem, signupType: SignupType.OTHER }],
  );
  expect(infoLines()).toEqual([]);
});

test("skips two-phase program types, which the lottery fills", () => {
  printDirectSignupFillTimes(
    [directSignup("2023-07-29T14:30:00.000Z")],
    [{ ...programItem, programType: ProgramType.FLEAMARKET }],
  );
  expect(infoLines()).toEqual([]);
});

test("groups program items under a heading per program type", () => {
  const workshop = {
    ...programItem,
    programItemId: "workshop",
    programType: ProgramType.WORKSHOP,
    title: "Test workshop",
  };
  printDirectSignupFillTimes(
    [
      directSignup("2023-07-29T14:30:00.000Z"),
      {
        ...directSignup("2023-07-29T13:07:00.000Z"),
        programItemId: "workshop",
      },
    ],
    [workshop, programItem],
  );
  expect(infoLines()).toEqual([
    "tabletopRPG (1 program items)",
    "  1h30min (2/4) - Test RPG",
    "  Summary: 0 of 1 program items full",
    "  Summary: 0 of 1 program items under min attendance",
    "  Summary: 0 of 1 program items filled in under a minute",
    "workshop (1 program items)",
    "  7min (2/4) - Test workshop",
    "  Summary: 0 of 1 program items full",
    "  Summary: 0 of 1 program items under min attendance",
    "  Summary: 0 of 1 program items filled in under a minute",
  ]);
});

// The refilled item counts by its first fill of three spots in 14s, the one
// that filled steadily in 42min does not, and the item short of full is not
// counted as full at all
test("summarizes per program type how many full program items filled in under a minute", () => {
  const refilled = { ...programItem, programItemId: "refilled" };
  const steady = { ...programItem, programItemId: "steady" };
  const shortOfFull = { ...programItem, programItemId: "short" };
  printDirectSignupFillTimes(
    [
      {
        ...signupsAt([
          "2023-07-29T13:00:05.000Z",
          "2023-07-29T13:00:14.000Z",
          "2023-07-29T13:00:09.000Z",
          "2023-07-29T16:18:00.000Z",
        ]),
        programItemId: "refilled",
      },
      {
        ...signupsAt([
          "2023-07-29T13:10:00.000Z",
          "2023-07-29T13:20:00.000Z",
          "2023-07-29T13:41:00.000Z",
          "2023-07-29T13:42:00.000Z",
        ]),
        programItemId: "steady",
      },
      {
        ...signupsAt(["2023-07-29T13:00:05.000Z", "2023-07-29T13:00:09.000Z"]),
        programItemId: "short",
      },
    ],
    [refilled, steady, shortOfFull],
  );
  expect(infoLines()).toContain(
    "  Summary: 1 of 3 program items filled in under a minute",
  );
});

test("summarizes per program type how many program items are full or under min attendance", () => {
  const full = { ...programItem, programItemId: "full", minAttendance: 2 };
  const running = {
    ...programItem,
    programItemId: "running",
    minAttendance: 2,
  };
  const empty = { ...programItem, programItemId: "empty", minAttendance: 2 };
  const tooFew = { ...programItem, programItemId: "tooFew", minAttendance: 2 };
  const at = (
    count: number,
    programItemId: string,
  ): DirectSignupsForProgramItem => ({
    ...signupsAt(
      Array.from({ length: count }, () => "2023-07-29T13:00:05.000Z"),
    ),
    programItemId,
  });
  printDirectSignupFillTimes(
    [at(4, "full"), at(3, "running"), at(1, "tooFew")],
    [full, running, empty, tooFew],
  );
  expect(infoLines()).toContain("  Summary: 1 of 4 program items full");
  expect(infoLines()).toContain(
    "  Summary: 2 of 4 program items under min attendance",
  );
});

test("splits two-phase program item spots into lottery wins and direct sign-ups", () => {
  const fleaMarket = { ...programItem, programType: ProgramType.FLEAMARKET };
  const signups = signupsAt([
    "2023-07-29T11:00:00.000Z",
    "2023-07-29T11:00:00.000Z",
    "2023-07-29T13:07:00.000Z",
  ]);
  printProgramItemSignups(
    [
      {
        ...signups,
        userSignups: signups.userSignups.map((userSignup, index) => ({
          ...userSignup,
          priority: index < 2 ? 1 : 0,
        })),
      },
    ],
    [fleaMarket, programItem],
  );
  expect(infoLines()).toEqual([
    "fleaMarket (1 program items)",
    "  Sat 20:00 - max: 4 - lottery: 2 - direct: 1",
  ]);
});
