import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";

export const getGroupMembersWithCreatorLotterySignups = (
  groupCreators: readonly User[],
  users: readonly User[],
): readonly User[] => {
  logger.debug("Get group members");

  const selectedAttendeesWithSignups: User[] = [];

  for (const groupCreator of groupCreators) {
    // Skip individual users
    if (groupCreator.groupCode !== "0") {
      for (const user of users) {
        // User is in the group but is not the creator
        if (
          user.groupCode === groupCreator.groupCode &&
          user.username !== groupCreator.username
        ) {
          // Group member gets group creator's lottery signups
          selectedAttendeesWithSignups.push(
            Object.assign({
              ...user,
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
