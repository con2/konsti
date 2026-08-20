import { addMinutes, subMinutes } from "date-fns";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { ProgramType, Tag } from "shared/types/models/programItem";
import {
  getDirectSignupEnded,
  getDirectSignupInProgress,
  getDirectSignupStartTime,
  getLotterySignupEndTime,
  getLotterySignupInProgress,
  getLotterySignupNotStarted,
  getLotterySignupStartTime,
} from "shared/utils/signupTimes";

const friday = "2023-07-28";
const saturday = "2023-07-29";
const sunday = "2023-07-30";

beforeEach(() => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventStartTime: `${friday}T12:00:00Z`,
    fixedLotterySignupTime: null,
    enableRollingDirectSignupPreviousDay: true,
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    directSignupWindows: {
      larp: [
        // Friday
        {
          signupWindowStart: new Date(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
          signupWindowClose: new Date(`${friday}T21:00:00Z`), // Fri 24:00 GMT+3
        },
        // Saturday morning / day
        {
          signupWindowStart: new Date(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
          signupWindowClose: new Date(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
        },
        // Saturday evening
        {
          signupWindowStart: new Date(`${saturday}T08:00:00Z`), // Sat 11:00 GMT+3
          signupWindowClose: new Date(`${saturday}T21:00:00Z`), // Sat 24:00 GMT+3
        },
        // Sunday
        {
          signupWindowStart: new Date(`${saturday}T12:00:00Z`), // Sat 15:00 GMT+3
          signupWindowClose: new Date(`${sunday}T21:00:00Z`), // Sun 24:00 GMT+3
        },
      ],
    },
    rollingDirectSignupProgramTypes: [ProgramType.WORKSHOP],
  });
});

describe("Lottery signup", () => {
  test("RPG starting at 15:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T12:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 16:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T13:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 17:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T14:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 18:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T15:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 19:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T16:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 20:00 should have signup starting at 16:00", () => {
    const startTime = `${friday}T17:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T13:00:00.000Z`);
  });

  test("RPG starting at 21:00 should have signup starting at 17:00", () => {
    const startTime = `${friday}T18:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T14:00:00.000Z`);
  });
});

describe("Early lottery signup", () => {
  test("RPG starting at 09:00 should have signup starting at 22:00", () => {
    const startTime = `${saturday}T06:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T19:00:00.000Z`);
  });

  test("RPG starting at 10:00 should have signup starting at 22:00", () => {
    const startTime = `${saturday}T07:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T19:00:00.000Z`);
  });

  test("RPG starting at 11:00 should have signup starting at 07:00", () => {
    const startTime = `${saturday}T08:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${saturday}T04:00:00.000Z`);
  });

  test("RPG starting at 12:00 should have signup starting at 08:00", () => {
    const startTime = `${saturday}T09:00:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${saturday}T05:00:00.000Z`);
  });

  test("RPG starting at 09:15 should have signup starting at 22:00, not 22:15", () => {
    const startTime = `${saturday}T06:15:00.000Z`;
    const programItem = { ...testProgramItem, startTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    expect(signupStartTime.toISOString()).toEqual(`${friday}T19:00:00.000Z`);
  });
});

describe("Two phase direct signup", () => {
  test("RPG starting at 15:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T12:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 16:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T13:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 17:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T14:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(signupStartTime.toISOString()).toEqual(`${friday}T12:00:00.000Z`);
  });

  test("RPG starting at 18:00 should have signup starting at 16:15", () => {
    const startTime = `${friday}T15:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(signupStartTime.toISOString()).toEqual(`${friday}T13:15:00.000Z`);
  });

  test("RPG starting at 19:00 should have signup starting at 17:15", () => {
    const startTime = `${friday}T16:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(signupStartTime.toISOString()).toEqual(`${friday}T14:15:00.000Z`);
  });

  test("RPG starting at 20:00 should have signup starting at 18:15", () => {
    const startTime = `${friday}T17:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(signupStartTime.toISOString()).toEqual(`${friday}T15:15:00.000Z`);
  });
});

describe("Pre-convention week direct signup", () => {
  const preConventionWeekSignupStartTime = `${friday}T17:00:00.000Z`;

  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      preConventionWeekSignupStartTime,
    });
  });

  const preConventionWeekItem = {
    ...testProgramItem,
    tags: [Tag.PRE_CONVENTION_WEEK],
    startTime: `${saturday}T12:00:00.000Z`,
  };

  test("signup starts at the configured pre-convention week signup start time", () => {
    const signupStartTime = getDirectSignupStartTime(preConventionWeekItem);
    expect(signupStartTime.toISOString()).toEqual(
      preConventionWeekSignupStartTime,
    );
  });

  test("signup is not in progress before pre-convention week signup start time", () => {
    const timeNow = subMinutes(new Date(preConventionWeekSignupStartTime), 1);
    expect(getDirectSignupInProgress(preConventionWeekItem, timeNow)).toEqual(
      false,
    );
  });

  test("signup is in progress after pre-convention week signup start time", () => {
    const timeNow = new Date(preConventionWeekSignupStartTime);
    expect(getDirectSignupInProgress(preConventionWeekItem, timeNow)).toEqual(
      true,
    );
  });
});

describe("Parent start time override via 'startTimesByParentIds'", () => {
  // Own start time is later than the parent start time, so sign-up times computed
  // from the parent start time differ from the ones computed from the own start time
  const ownStartTime = `${saturday}T15:00:00.000Z`; // Sat 18:00 GMT+3
  const parentStartTime = `${saturday}T12:00:00.000Z`; // Sat 15:00 GMT+3

  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map([
        [testProgramItem.parentId, parentStartTime],
      ]),
    });
  });

  test("getLotterySignupStartTime uses parent start time", () => {
    const programItem = { ...testProgramItem, startTime: ownStartTime };
    const signupStartTime = getLotterySignupStartTime(programItem);
    // preSignupStart (4h) before parent start time, not own start time
    expect(signupStartTime.toISOString()).toEqual(`${saturday}T08:00:00.000Z`);
  });

  test("getLotterySignupEndTime uses parent start time", () => {
    const programItem = { ...testProgramItem, startTime: ownStartTime };
    const signupEndTime = getLotterySignupEndTime(programItem);
    // directSignupPhaseStart (2h) before parent start time, not own start time
    expect(signupEndTime.toISOString()).toEqual(`${saturday}T10:00:00.000Z`);
  });

  test("getDirectSignupStartTime uses parent start time", () => {
    const programItem = { ...testProgramItem, startTime: ownStartTime };
    const signupStartTime = getDirectSignupStartTime(programItem);
    // directSignupPhaseStart (2h) before parent start time, plus phaseGap (15min)
    expect(signupStartTime.toISOString()).toEqual(`${saturday}T10:15:00.000Z`);
  });

  test("falls back to own start time when parentId has no override", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map(),
    });
    const programItem = { ...testProgramItem, startTime: ownStartTime };
    const signupEndTime = getLotterySignupEndTime(programItem);
    // directSignupPhaseStart (2h) before own start time
    expect(signupEndTime.toISOString()).toEqual(`${saturday}T13:00:00.000Z`);
  });
});

describe("Direct signup with signup windows", () => {
  const testLarp = { ...testProgramItem, programType: ProgramType.LARP };
  const testLarp2 = { ...testProgramItem2, programType: ProgramType.LARP };

  const assertSignupTime = (startTime: string, signupTime: string): void => {
    const signupStartTime = getDirectSignupStartTime({
      ...testLarp,
      startTime,
    });
    const signupStartTime2 = getDirectSignupStartTime({
      ...testLarp2,
      startTime,
    });

    expect(signupStartTime.toISOString()).toEqual(signupTime);
    expect(signupStartTime2.toISOString()).toEqual(signupTime);
  };

  test("Larp starting at Fri 15:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T12:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 16:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T13:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 17:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T14:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 18:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T15:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 19:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T16:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 20:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T17:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Sat 20:00 should have signup starting at Sat 11:00", () => {
    const startTime = `${saturday}T17:00:00.000Z`;
    const signupTime = `${saturday}T08:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Sun 12:00 should have signup starting at Sat 15:00", () => {
    const startTime = `${sunday}T09:00:00.000Z`;
    const signupTime = `${saturday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });
});

describe("Direct signup with rolling signup", () => {
  const testWorkshop = {
    ...testProgramItem,
    programType: ProgramType.WORKSHOP,
  };
  const testWorkshop2 = {
    ...testProgramItem2,
    programType: ProgramType.WORKSHOP,
  };

  const assertSignupTime = (startTime: string, signupTime: string): void => {
    const signupStartTime = getDirectSignupStartTime({
      ...testWorkshop,
      startTime,
    });
    const signupStartTime2 = getDirectSignupStartTime({
      ...testWorkshop2,
      startTime,
    });

    expect(signupStartTime.toISOString()).toEqual(signupTime);
    expect(signupStartTime2.toISOString()).toEqual(signupTime);
  };

  test("Workshop starting at Fri 15:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T12:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Fri 16:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T13:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Fri 17:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T14:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Fri 18:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T15:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Fri 19:00 should have signup starting at Fri 15:00", () => {
    const startTime = `${friday}T16:00:00.000Z`;
    const signupTime = `${friday}T12:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Fri 20:00 should have signup starting at Fri 16:00", () => {
    const startTime = `${friday}T17:00:00.000Z`;
    const signupTime = `${friday}T13:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Sat 11:00 should have signup starting at Fri 18:00", () => {
    const startTime = `${saturday}T08:00:00.000Z`;
    const signupTime = `${friday}T15:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Sat 12:00 should have signup starting at Sat 08:00", () => {
    const startTime = `${saturday}T09:00:00.000Z`;
    const signupTime = `${saturday}T05:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Sat 11:15 should have signup starting at Fri 18:00, not 18:15", () => {
    const startTime = `${saturday}T08:15:00.000Z`;
    const signupTime = `${friday}T15:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Sat 20:00 should have signup starting at Sat 16:00", () => {
    const startTime = `${saturday}T17:00:00.000Z`;
    const signupTime = `${saturday}T13:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });

  test("Workshop starting at Sun 11:00 should have signup starting at Sat 18:00", () => {
    const startTime = `${sunday}T08:00:00.000Z`;
    const signupTime = `${saturday}T15:00:00.000Z`;
    assertSignupTime(startTime, signupTime);
  });
});

// The "open the previous evening at a fixed hour" path has to land on the same
// wall-clock hour whether the previous day was 23, 24 or 25 hours long
describe("Signup times across DST transitions", () => {
  const testWorkshop = {
    ...testProgramItem,
    programType: ProgramType.WORKSHOP,
  };

  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      eventStartTime: "2026-03-01T12:00:00Z",
      fixedLotterySignupTime: null,
      enableRollingDirectSignupPreviousDay: true,
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
      rollingDirectSignupProgramTypes: [ProgramType.WORKSHOP],
    });
  });

  test("lottery signup opens at 22:00 the evening before a spring-forward day", () => {
    // Mon 30.3. 05:00 GMT+3, the day after clocks jumped forward
    const programItem = {
      ...testProgramItem,
      startTime: "2026-03-30T02:00:00.000Z",
    };
    const signupStartTime = getLotterySignupStartTime(programItem);
    // Sun 29.3. 22:00 GMT+3, on a day that was only 23 hours long
    expect(signupStartTime.toISOString()).toEqual("2026-03-29T19:00:00.000Z");
  });

  test("lottery signup opens at 22:00 the evening before a fall-back day", () => {
    // Mon 26.10. 05:00 GMT+2, the day after clocks fell back
    const programItem = {
      ...testProgramItem,
      startTime: "2026-10-26T03:00:00.000Z",
    };
    const signupStartTime = getLotterySignupStartTime(programItem);
    // Sun 25.10. 22:00 GMT+2, on a day that was 25 hours long
    expect(signupStartTime.toISOString()).toEqual("2026-10-25T20:00:00.000Z");
  });

  test("rolling signup opens at 18:00 the evening before a spring-forward day", () => {
    // Mon 30.3. 09:00 GMT+3
    const programItem = {
      ...testWorkshop,
      startTime: "2026-03-30T06:00:00.000Z",
    };
    const signupStartTime = getDirectSignupStartTime(programItem);
    // Sun 29.3. 18:00 GMT+3
    expect(signupStartTime.toISOString()).toEqual("2026-03-29T15:00:00.000Z");
  });

  // The day before a spring-forward is only 23 hours long, so stepping back a
  // fixed 24 hours from just after midnight lands on the day before the one meant
  test("rolling signup opens the previous evening for a just-after-midnight start", () => {
    // Mon 30.3. 00:30 GMT+3
    const programItem = {
      ...testWorkshop,
      startTime: "2026-03-29T21:30:00.000Z",
    };
    const signupStartTime = getDirectSignupStartTime(programItem);
    // Sun 29.3. 18:00 GMT+3, not Sat 28.3.
    expect(signupStartTime.toISOString()).toEqual("2026-03-29T15:00:00.000Z");
  });

  test("rolling signup opens at 18:00 the evening before a fall-back day", () => {
    // Mon 26.10. 09:00 GMT+2
    const programItem = {
      ...testWorkshop,
      startTime: "2026-10-26T07:00:00.000Z",
    };
    const signupStartTime = getDirectSignupStartTime(programItem);
    // Sun 25.10. 18:00 GMT+2
    expect(signupStartTime.toISOString()).toEqual("2026-10-25T16:00:00.000Z");
  });
});

describe("Relative lottery signup state", () => {
  const startTime = `${saturday}T12:00:00.000Z`;
  const programItem = { ...testProgramItem, startTime };

  test("Lottery signup not yet started", () => {
    const { preSignupStart } = config.event();
    const timeNow = subMinutes(
      new Date(`${saturday}T12:00:00.000Z`),
      preSignupStart + 1,
    );
    const lotterySignupNotStarted = getLotterySignupNotStarted(
      programItem,
      timeNow,
    );
    expect(lotterySignupNotStarted).toEqual(true);
  });

  test("Lottery signup started", () => {
    const { preSignupStart } = config.event();
    const timeNow = subMinutes(
      new Date(`${saturday}T12:00:00.000Z`),
      preSignupStart,
    );
    const lotterySignupNotStarted = getLotterySignupNotStarted(
      programItem,
      timeNow,
    );
    expect(lotterySignupNotStarted).toEqual(false);
  });

  test("Lottery signup not in progress yet", () => {
    const { preSignupStart } = config.event();
    const timeNow = subMinutes(
      new Date(`${saturday}T12:00:00.000Z`),
      preSignupStart + 1,
    );
    const lotterySignupInProgress = getLotterySignupInProgress(
      programItem,
      timeNow,
    );
    expect(lotterySignupInProgress).toEqual(false);
  });

  test("Lottery signup in progress, lower limit", () => {
    const { preSignupStart } = config.event();
    const timeNow = subMinutes(
      new Date(`${saturday}T12:00:00.000Z`),
      preSignupStart,
    );
    const lotterySignupInProgress = getLotterySignupInProgress(
      programItem,
      timeNow,
    );
    expect(lotterySignupInProgress).toEqual(true);
  });

  test("Lottery signup in progress, upper limit", () => {
    const { directSignupPhaseStart } = config.event();
    const timeNow = subMinutes(
      new Date(`${saturday}T12:00:00.000Z`),
      directSignupPhaseStart,
    );
    const lotterySignupInProgress = getLotterySignupInProgress(
      programItem,
      timeNow,
    );
    expect(lotterySignupInProgress).toEqual(true);
  });

  test("Lottery signup ended", () => {
    const { directSignupPhaseStart } = config.event();
    const timeNow = subMinutes(
      new Date(`${saturday}T12:00:00.000Z`),
      directSignupPhaseStart - 1,
    );
    const lotterySignupInProgress = getLotterySignupInProgress(
      programItem,
      timeNow,
    );
    expect(lotterySignupInProgress).toEqual(false);
  });
});

describe("Relative direct signup state", () => {
  const programItem = {
    ...testProgramItem,
    startTime: `${saturday}T12:00:00.000Z`,
  };

  test("Direct signup not in progress yet", () => {
    const { directSignupPhaseStart, phaseGap } = config.event();
    const timeNow = subMinutes(
      new Date(programItem.startTime),
      directSignupPhaseStart - phaseGap + 1,
    );
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(false);
  });

  test("Direct signup in progress, lower limit", () => {
    const { directSignupPhaseStart, phaseGap } = config.event();
    const timeNow = subMinutes(
      new Date(programItem.startTime),
      directSignupPhaseStart - phaseGap,
    );
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(true);
  });

  test("Direct signup in progress, upper limit", () => {
    const timeNow = new Date(programItem.startTime);
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(true);
  });

  test("Direct signup not in progress anymore", () => {
    const timeNow = addMinutes(new Date(programItem.startTime), 1);
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(false);
  });

  test("Direct signup ended", () => {
    const timeNow = addMinutes(new Date(programItem.startTime), 1);
    const directSignupEnded = getDirectSignupEnded(programItem, timeNow);
    expect(directSignupEnded).toEqual(true);
  });

  test("Direct signup not ended", () => {
    const timeNow = new Date(programItem.startTime);
    const directSignupEnded = getDirectSignupEnded(programItem, timeNow);
    expect(directSignupEnded).toEqual(false);
  });
});
