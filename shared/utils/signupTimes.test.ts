import { beforeEach, describe, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import {
  getLotterySignupStartTime,
  getDirectSignupStartTime,
  getLotterySignupNotStarted,
  getLotterySignupInProgress,
  getDirectSignupInProgress,
  getDirectSignupEnded,
} from "shared/utils/signupTimes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";

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
          signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
          signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00 GMT+3
        },
        // Saturday morning / day
        {
          signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
          signupWindowClose: dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
        },
        // Saturday evening
        {
          signupWindowStart: dayjs(`${saturday}T08:00:00Z`), // Sat 11:00 GMT+3
          signupWindowClose: dayjs(`${saturday}T21:00:00Z`), // Sat 24:00 GMT+3
        },
        // Sunday
        {
          signupWindowStart: dayjs(`${saturday}T12:00:00Z`), // Sat 15:00 GMT+3
          signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00 GMT+3
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
});

describe("Two phase direct signup", () => {
  test("RPG starting at 15:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T12:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      `${friday}T12:00:00.000Z`,
    );
  });

  test("RPG starting at 16:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T13:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      `${friday}T12:00:00.000Z`,
    );
  });

  test("RPG starting at 17:00 should have signup starting at 15:00", () => {
    const startTime = `${friday}T14:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      `${friday}T12:00:00.000Z`,
    );
  });

  test("RPG starting at 18:00 should have signup starting at 16:15", () => {
    const startTime = `${friday}T15:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      `${friday}T13:15:00.000Z`,
    );
  });

  test("RPG starting at 19:00 should have signup starting at 17:15", () => {
    const startTime = `${friday}T16:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      `${friday}T14:15:00.000Z`,
    );
  });

  test("RPG starting at 20:00 should have signup starting at 18:15", () => {
    const startTime = `${friday}T17:00:00.000Z`;
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      `${friday}T15:15:00.000Z`,
    );
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

    expect(dayjs(signupStartTime).toISOString()).toEqual(signupTime);
    expect(dayjs(signupStartTime2).toISOString()).toEqual(signupTime);
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
    const startTime = `${sunday}T15:00:00.000Z`;
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

    expect(dayjs(signupStartTime).toISOString()).toEqual(signupTime);
    expect(dayjs(signupStartTime2).toISOString()).toEqual(signupTime);
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

describe("Relative lottery signup state", () => {
  const startTime = `${saturday}T12:00:00.000Z`;
  const programItem = { ...testProgramItem, startTime };

  test("Lottery signup not yet started", () => {
    const { preSignupStart } = config.event();
    const timeNow = dayjs(`${saturday}T12:00:00.000Z`).subtract(
      preSignupStart + 1,
      "minutes",
    );
    const lotterySignupNotStarted = getLotterySignupNotStarted(
      programItem,
      timeNow,
    );
    expect(lotterySignupNotStarted).toEqual(true);
  });

  test("Lottery signup started", () => {
    const { preSignupStart } = config.event();
    const timeNow = dayjs(`${saturday}T12:00:00.000Z`).subtract(
      preSignupStart,
      "minutes",
    );
    const lotterySignupNotStarted = getLotterySignupNotStarted(
      programItem,
      timeNow,
    );
    expect(lotterySignupNotStarted).toEqual(false);
  });

  test("Lottery signup not in progress yet", () => {
    const { preSignupStart } = config.event();
    const timeNow = dayjs(`${saturday}T12:00:00.000Z`).subtract(
      preSignupStart + 1,
      "minutes",
    );
    const lotterySignupInProgress = getLotterySignupInProgress(
      programItem,
      timeNow,
    );
    expect(lotterySignupInProgress).toEqual(false);
  });

  test("Lottery signup in progress, lower limit", () => {
    const { preSignupStart } = config.event();
    const timeNow = dayjs(`${saturday}T12:00:00.000Z`).subtract(
      preSignupStart,
      "minutes",
    );
    const lotterySignupInProgress = getLotterySignupInProgress(
      programItem,
      timeNow,
    );
    expect(lotterySignupInProgress).toEqual(true);
  });

  test("Lottery signup in progress, upper limit", () => {
    const { directSignupPhaseStart } = config.event();
    const timeNow = dayjs(`${saturday}T12:00:00.000Z`).subtract(
      directSignupPhaseStart,
      "minutes",
    );
    const lotterySignupInProgress = getLotterySignupInProgress(
      programItem,
      timeNow,
    );
    expect(lotterySignupInProgress).toEqual(true);
  });

  test("Lottery signup ended", () => {
    const { directSignupPhaseStart } = config.event();
    const timeNow = dayjs(`${saturday}T12:00:00.000Z`).subtract(
      directSignupPhaseStart - 1,
      "minutes",
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
    const timeNow = dayjs(programItem.startTime).subtract(
      directSignupPhaseStart - phaseGap + 1,
      "minutes",
    );
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(false);
  });

  test("Direct signup in progress, lower limit", () => {
    const { directSignupPhaseStart, phaseGap } = config.event();
    const timeNow = dayjs(programItem.startTime).subtract(
      directSignupPhaseStart - phaseGap,
      "minutes",
    );
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(true);
  });

  test("Direct signup in progress, upper limit", () => {
    const timeNow = dayjs(programItem.startTime);
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(true);
  });

  test("Direct signup not in progress anymore", () => {
    const timeNow = dayjs(programItem.startTime).add(1, "minute");
    const directSignupInProgress = getDirectSignupInProgress(
      programItem,
      timeNow,
    );
    expect(directSignupInProgress).toEqual(false);
  });

  test("Direct signup ended", () => {
    const timeNow = dayjs(programItem.startTime).add(1, "minute");
    const directSignupEnded = getDirectSignupEnded(programItem, timeNow);
    expect(directSignupEnded).toEqual(true);
  });

  test("Direct signup not ended", () => {
    const timeNow = dayjs(programItem.startTime);
    const directSignupEnded = getDirectSignupEnded(programItem, timeNow);
    expect(directSignupEnded).toEqual(false);
  });
});
