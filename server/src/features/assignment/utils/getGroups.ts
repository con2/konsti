import { first, groupBy, shuffle } from "remeda";
import { Group } from "server/types/assignmentTypes";
import { isStartTimeMatch } from "server/utils/isStartTimeMatch";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";

export const getGroups = (
  attendeeGroups: readonly User[][],
  assignmentTime: string,
  lotterySignupProgramItems: readonly ProgramItem[],
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
      (lotterySignup) => {
        const programItem = lotterySignupProgramItems.find(
          (lotterySignupProgramItem) =>
            lotterySignupProgramItem.programItemId ===
            lotterySignup.programItemId,
        );

        return isStartTimeMatch(
          lotterySignup.signedToStartTime,
          assignmentTime,
          programItem?.parentId,
        );
      },
    );

    // Sort by priority, randomize between same priority values
    const sortedLotterySignups = Object.values(
      groupBy(lotterySignupsForStartTime, (item) => item.priority),
    ) // Group by priority
      .map((group) => shuffle(group)) // Shuffle each group
      .sort((a, b) => a[0].priority - b[0].priority) // Sort groups by priority, ascending
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
