import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";

export const getGroupMembers = (
  groupCreators: readonly User[],
  players: readonly User[],
): readonly User[] => {
  logger.debug("Add group members to groups");

  const selectedPlayersWithSignups = [] as User[];

  for (const groupCreator of groupCreators) {
    // Skip individual users
    if (groupCreator.groupCode !== "0") {
      for (const player of players) {
        // User is in the group but is not the creator
        if (
          player.groupCode === groupCreator.groupCode &&
          player.username !== groupCreator.username
        ) {
          // player.lotterySignups = groupCreator.lotterySignups
          selectedPlayersWithSignups.push(
            Object.assign({
              ...player,
              lotterySignups: groupCreator.lotterySignups,
            }) as User,
          );
        }
      }
    }
  }

  logger.debug(`Found ${selectedPlayersWithSignups.length} group members`);

  return selectedPlayersWithSignups;
};
