import dayjs from "dayjs";
import { first, sortBy } from "remeda";
import { Group } from "server/types/assignmentTypes";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";

export const getGroups = (
  attendeeGroups: readonly User[][],
  assignmentTime: string,
): Group[] => {
  const results = attendeeGroups.flatMap((attendeeGroup) => {
    const firstMember = first(attendeeGroup);
    if (!firstMember) {
      logger.error(
        "%s",
        new Error("Assignment getGroups: error getting first member"),
      );
      return [];
    }

    const lotterySignupsForStartTime = firstMember.lotterySignups.filter(
      (lotterySignup) =>
        dayjs(lotterySignup.signedToStartTime).toISOString() ===
        dayjs(assignmentTime).toISOString(),
    );

    const sortedLotterySignups = sortBy(
      lotterySignupsForStartTime,
      (lotterySignup) => lotterySignup.priority,
    );

    return {
      id:
        firstMember.groupCode === "0"
          ? firstMember.serial
          : firstMember.groupCode,
      size: attendeeGroup.length,
      pref: sortedLotterySignups.map(
        (lotterySignup) => lotterySignup.programItemId,
      ),
    };
  });

  return results;
};
