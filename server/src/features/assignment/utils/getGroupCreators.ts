import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";

export const getGroupCreators = (
  users: readonly User[],
  startingProgramItems: readonly ProgramItem[],
): User[] => {
  logger.debug("Get group creators");

  // Get users who have lottery signups for starting program items
  const selectedAttendees = [] as User[];

  users.forEach((user) => {
    let match = false;
    for (let i = 0; i < user.lotterySignups.length; i += 1) {
      for (let j = 0; j < startingProgramItems.length; j += 1) {
        if (
          user.lotterySignups[i].programItem.programItemId ===
          startingProgramItems[j].programItemId
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
  });

  logger.debug(
    `Found ${selectedAttendees.length} group creators for this start time`,
  );

  return selectedAttendees;
};