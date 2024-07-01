import { beforeEach, describe, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import {
  getAlgorithmSignupStartTime,
  getDirectSignupStartTime,
} from "shared/utils/signupTimes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";

// const friday = "2023-07-28";
// const saturday = "2023-07-29";
// const sunday = "2023-07-30";

beforeEach(() => {
  vi.spyOn(config, "shared").mockReturnValue({
    ...config.shared(),
    conventionStartTime: "2023-07-28T12:00:00Z",
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    directSignupWindows: {
      larp: [
        // Friday
        {
          signupWindowStart: dayjs("2023-07-28T12:00:00Z"), // Fri 15:00 GMT+3
          signupWindowClose: dayjs("2023-07-28T21:00:00Z"), // Fri 24:00 GMT+3
        },
        // Saturday morning / day
        {
          signupWindowStart: dayjs("2023-07-28T15:00:00Z"), // Fri 18:00 GMT+3
          signupWindowClose: dayjs("2023-07-29T15:00:00Z"), // Sat 18:00 GMT+3
        },
        // Saturday evening
        {
          signupWindowStart: dayjs("2023-07-29T08:00:00Z"), // Sat 11:00 GMT+3
          signupWindowClose: dayjs("2023-07-29T21:00:00Z"), // Sat 24:00 GMT+3
        },
        // Sunday
        {
          signupWindowStart: dayjs("2023-07-29T12:00:00Z"), // Sat 15:00 GMT+3
          signupWindowClose: dayjs("2023-07-30T21:00:00Z"), // Sun 24:00 GMT+3
        },
      ],
    },
  });
});

describe(`Algorithm signup`, () => {
  test("RPG starting at 15:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T12:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T12:00:00.000Z");
  });

  test("RPG starting at 16:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T13:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T12:00:00.000Z");
  });

  test("RPG starting at 17:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T14:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T12:00:00.000Z");
  });

  test("RPG starting at 18:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T15:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T12:00:00.000Z");
  });

  test("RPG starting at 19:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T16:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T12:00:00.000Z");
  });

  test("RPG starting at 20:00 should have signup starting at 16:00", () => {
    const startTime = "2023-07-28T17:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T13:00:00.000Z");
  });

  test("RPG starting at 21:00 should have signup starting at 17:00", () => {
    const startTime = "2023-07-28T18:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T14:00:00.000Z");
  });
});

describe(`Early algorithm signup`, () => {
  test("RPG starting at 09:00 should have signup starting at 22:00", () => {
    const startTime = "2023-07-29T06:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T19:00:00.000Z");
  });

  test("RPG starting at 10:00 should have signup starting at 22:00", () => {
    const startTime = "2023-07-29T07:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-28T19:00:00.000Z");
  });

  test("RPG starting at 11:00 should have signup starting at 07:00", () => {
    const startTime = "2023-07-29T08:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-29T04:00:00.000Z");
  });

  test("RPG starting at 12:00 should have signup starting at 08:00", () => {
    const startTime = "2023-07-29T09:00:00.000Z";
    const signupStartTime = getAlgorithmSignupStartTime(startTime);
    expect(signupStartTime.toISOString()).toEqual("2023-07-29T05:00:00.000Z");
  });
});

describe(`Two phase direct signup`, () => {
  test("RPG starting at 15:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T12:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T12:00:00.000Z",
    );
  });

  test("RPG starting at 16:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T13:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T12:00:00.000Z",
    );
  });

  test("RPG starting at 17:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T14:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T12:00:00.000Z",
    );
  });

  test("RPG starting at 18:00 should have signup starting at 16:15", () => {
    const startTime = "2023-07-28T15:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T13:15:00.000Z",
    );
  });

  test("RPG starting at 19:00 should have signup starting at 17:15", () => {
    const startTime = "2023-07-28T16:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T14:15:00.000Z",
    );
  });

  test("RPG starting at 20:00 should have signup starting at 18:15", () => {
    const startTime = "2023-07-28T17:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testProgramItem,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T15:15:00.000Z",
    );
  });
});

describe(`Direct signup`, () => {
  const testLarp = { ...testProgramItem, programType: ProgramType.LARP };
  const testLarp2 = { ...testProgramItem2, programType: ProgramType.LARP };

  const assertSignupTime = (startTime: string, signupTime: string) => {
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
    const startTime = "2023-07-28T12:00:00.000Z";
    const signupTime = "2023-07-28T12:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 16:00 should have signup starting at Fri 15:00", () => {
    const startTime = "2023-07-28T13:00:00.000Z";
    const signupTime = "2023-07-28T12:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 17:00 should have signup starting at Fri 15:00", () => {
    const startTime = "2023-07-28T14:00:00.000Z";
    const signupTime = "2023-07-28T12:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 18:00 should have signup starting at Fri 15:00", () => {
    const startTime = "2023-07-28T15:00:00.000Z";
    const signupTime = "2023-07-28T12:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 19:00 should have signup starting at Fri 15:00", () => {
    const startTime = "2023-07-28T16:00:00.000Z";
    const signupTime = "2023-07-28T12:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Fri 20:00 should have signup starting at Fri 15:00", () => {
    const startTime = "2023-07-28T17:00:00.000Z";
    const signupTime = "2023-07-28T12:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Sat 20:00 should have signup starting at Sat 11:00", () => {
    const startTime = "2023-07-29T17:00:00.000Z";
    const signupTime = "2023-07-29T08:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });

  test("Larp starting at Sun 12:00 should have signup starting at Sat 15:00", () => {
    const startTime = "2023-07-30T15:00:00.000Z";
    const signupTime = "2023-07-29T12:00:00.000Z";
    assertSignupTime(startTime, signupTime);
  });
});
