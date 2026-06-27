import { expect, test } from "vitest";
import { getPopularity } from "server/features/program-item-popularity/getPopularity";
import { Popularity } from "shared/types/models/programItem";

test("Should return LOW popularity with not enough participants", () => {
  const popularity = getPopularity({
    minAttendance: 2,
    maxAttendance: 2,
    assignmentSignupCount: 1,
    lotterySignups: [],
  });
  expect(popularity).toEqual(Popularity.LOW);
});

test("Should return MEDIUM popularity with at least min participants", () => {
  const popularity = getPopularity({
    minAttendance: 1,
    maxAttendance: 2,
    assignmentSignupCount: 1,
    lotterySignups: [],
  });
  expect(popularity).toEqual(Popularity.MEDIUM);
});

test("Should return HIGH popularity with max participants", () => {
  const popularity = getPopularity({
    minAttendance: 1,
    maxAttendance: 1,
    assignmentSignupCount: 1,
    lotterySignups: [],
  });
  expect(popularity).toEqual(Popularity.HIGH);
});

const priority1 = [{ priority: 1, programItemId: "", signedToStartTime: "" }];
const priority2 = [
  { priority: 2, programItemId: "", signedToStartTime: "" },
  { priority: 2, programItemId: "", signedToStartTime: "" },
];
const priority3 = [
  { priority: 3, programItemId: "", signedToStartTime: "" },
  { priority: 3, programItemId: "", signedToStartTime: "" },
  { priority: 3, programItemId: "", signedToStartTime: "" },
];

test("Should return VERY HIGH popularity with max participants + VERY_HIGH_MODIFIER_LIMIT", () => {
  const popularity = getPopularity({
    minAttendance: 1,
    maxAttendance: 1,
    assignmentSignupCount: 1,
    lotterySignups: [...priority1, ...priority2, ...priority3],
  });
  expect(popularity).toEqual(Popularity.VERY_HIGH);
});

test("Should return EXTREME popularity with max participants + EXTREME_MODIFIER_LIMIT", () => {
  const popularity = getPopularity({
    minAttendance: 1,
    maxAttendance: 1,
    assignmentSignupCount: 1,
    lotterySignups: [
      ...priority1,
      ...priority1,
      ...priority2,
      ...priority2,
      ...priority3,
    ],
  });
  expect(popularity).toEqual(Popularity.EXTREME);
});
