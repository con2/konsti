import { first, groupBy, shuffle } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import {
  getLotterySignupsInRun,
  indexProgramItemsById,
} from "server/features/assignment/utils/getLotterySignupsInRun";
import { Group } from "server/types/assignmentTypes";
import { logger } from "server/utils/logger";

export const getGroups = (
  attendeeGroups: readonly User[][],
  assignmentTime: string,
  lotterySignupProgramItems: readonly ProgramItem[],
): Group[] => {
  const programItemsById = indexProgramItemsById(lotterySignupProgramItems);

  const results = attendeeGroups.flatMap((attendeeGroup) => {
    const firstMember = first(attendeeGroup);
    if (!firstMember) {
      logger.error(
        new Error("Assignment getGroups: error getting first member"),
      );
      return [];
    }

    const lotterySignupsForStartTime = getLotterySignupsInRun(
      firstMember.lotterySignups,
      programItemsById,
      assignmentTime,
    );

    // Sort by priority, randomize between same priority values
    const sortedLotterySignups = Object.values(
      groupBy(lotterySignupsForStartTime, (item) => item.priority),
    ) // Group by priority
      .map((group) => shuffle(group)) // Shuffle each group
      .toSorted((a, b) => a[0].priority - b[0].priority) // Sort groups by priority, ascending
      .flat();

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
