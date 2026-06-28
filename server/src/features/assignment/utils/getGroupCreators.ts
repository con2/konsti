import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";

export const getGroupCreators = (
  users: readonly User[],
  startingProgramItems: readonly ProgramItem[],
): User[] => {
  logger.debug("Get group creators");

  // Get users who have lottery signups for starting program items
  const selectedAttendees: User[] = [];

  for (const user of users) {
    // Only individuals and group creators carry lottery signups into the assignment.
    // A non-creator member's signups must not turn them into a group creator, which
    // would duplicate the group when its members are expanded
    if (user.groupCode !== "0" && !user.isGroupCreator) {
      continue;
    }

    let match = false;
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < user.lotterySignups.length; i += 1) {
      for (const startingProgramItem of startingProgramItems) {
        if (
          user.lotterySignups[i].programItemId ===
          startingProgramItem.programItemId
        ) {
          match = true;
          break;
        }
      }
      // User matched, break
      if (match) {
        selectedAttendees.push(user);
        break;
      }
    }
  }

  logger.debug(
    `Found ${selectedAttendees.length} group creators for this start time`,
  );

  return selectedAttendees;
};
