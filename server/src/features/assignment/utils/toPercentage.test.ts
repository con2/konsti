import { expect, test } from "vitest";
import { toPercentage } from "server/features/assignment/utils/toPercentage";

test("should render a share as a rounded percentage", () => {
  expect(toPercentage(1, 4)).toEqual("25%");
  expect(toPercentage(2, 3)).toEqual("67%");
  expect(toPercentage(5, 5)).toEqual("100%");
});

test("should render a zero total as 0% rather than NaN", () => {
  // Reachable whenever every attendee for a start time already holds a spot: nobody is
  // left in the run, but the program items still have lottery sign-ups
  expect(toPercentage(0, 0)).toEqual("0%");
});
