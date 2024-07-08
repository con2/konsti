import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";

export const getGroupMembers = (
  groupCreators: readonly User[],
  users: readonly User[],
): readonly User[] => {
  logger.debug("Get group members");

  const selectedAttendeesWithSignups = [] as User[];

  for (const groupCreator of groupCreators) {
    // Skip individual users
    if (groupCreator.groupCode !== "0") {
      for (const attendee of users) {
        // User is in the group but is not the creator
        if (
          attendee.groupCode === groupCreator.groupCode &&
          attendee.username !== groupCreator.username
        ) {
          // attendee.lotterySignups = groupCreator.lotterySignups
          selectedAttendeesWithSignups.push(
            Object.assign({
              ...attendee,
              lotterySignups: groupCreator.lotterySignups,
            }) as User,
          );
        }
      }
    }
  }

  logger.debug(`Found ${selectedAttendeesWithSignups.length} group members`);

  return selectedAttendeesWithSignups;
};
