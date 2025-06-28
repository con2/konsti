import { Popularity } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";

const VERY_HIGH_MODIFIER_LIMIT = 3;
const EXTEME_MODIFIER_LIMIT = 5;

interface GetPopularityParams {
  minAttendance: number;
  maxAttendance: number;
  assignmentSignupCount: number;
  lotterySignups: LotterySignup[];
}

export const getPopularity = ({
  minAttendance,
  maxAttendance,
  assignmentSignupCount,
  lotterySignups,
}: GetPopularityParams): Popularity => {
  // Use assignment result when popularity is not maximum
  if (assignmentSignupCount < minAttendance) {
    return Popularity.LOW;
  }
  if (
    assignmentSignupCount >= minAttendance &&
    assignmentSignupCount < maxAttendance
  ) {
    return Popularity.MEDIUM;
  }

  // When assignment popularity is maximum, we need to use additional modifier to determine HIGH, VERY_HIGH and EXTREME
  const priority1 = lotterySignups.filter((signup) => signup.priority === 1);
  const priority2 = lotterySignups.filter((signup) => signup.priority === 2);
  const priority3 = lotterySignups.filter((signup) => signup.priority === 3);

  const modifier =
    (priority1.length + priority2.length / 2 + priority3.length / 3) /
    maxAttendance;

  if (modifier >= EXTEME_MODIFIER_LIMIT) {
    return Popularity.EXTREME;
  }

  if (modifier >= VERY_HIGH_MODIFIER_LIMIT) {
    return Popularity.VERY_HIGH;
  }

  return Popularity.HIGH;
};
