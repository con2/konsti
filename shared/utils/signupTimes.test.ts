import { describe, expect, test } from "vitest";
import dayjs from "dayjs";
import {
  getAlgorithmSignupStartTime,
  getDirectSignupStartTime,
} from "shared/utils/signupTimes";
import { testGame } from "shared/tests/testGame";

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

describe(`Direct signup`, () => {
  test("RPG starting at 15:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T12:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testGame,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T12:00:00.000Z"
    );
  });

  test("RPG starting at 16:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T13:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testGame,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T12:00:00.000Z"
    );
  });

  test("RPG starting at 17:00 should have signup starting at 15:00", () => {
    const startTime = "2023-07-28T14:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testGame,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T12:00:00.000Z"
    );
  });

  test("RPG starting at 18:00 should have signup starting at 16:15", () => {
    const startTime = "2023-07-28T15:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testGame,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T13:15:00.000Z"
    );
  });

  test("RPG starting at 19:00 should have signup starting at 17:15", () => {
    const startTime = "2023-07-28T16:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testGame,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T14:15:00.000Z"
    );
  });

  test("RPG starting at 20:00 should have signup starting at 18:15", () => {
    const startTime = "2023-07-28T17:00:00.000Z";
    const signupStartTime = getDirectSignupStartTime({
      ...testGame,
      startTime,
    });
    expect(dayjs(signupStartTime).toISOString()).toEqual(
      "2023-07-28T15:15:00.000Z"
    );
  });
});
