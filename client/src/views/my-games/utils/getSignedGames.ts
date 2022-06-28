import { getUpcomingSignedGames } from "client/utils/getUpcomingGames";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { getGroupCreator } from "client/views/my-games/utils/getGroupCreator";
import { GroupMember } from "shared/typings/api/groups";
import { SelectedGame } from "shared/typings/models/user";

export const getSignedGames = (
  signedGames: readonly SelectedGame[],
  groupCode: string,
  serial: string,
  showAllGames: boolean,
  groupMembers: readonly GroupMember[]
): readonly SelectedGame[] => {
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  if (isGroupCreator) {
    if (!showAllGames) return getUpcomingSignedGames(signedGames);
    else return signedGames;
  }

  if (!isGroupCreator) {
    const groupCreator = getGroupCreator(groupMembers);

    if (!showAllGames) {
      return getUpcomingSignedGames(
        groupCreator ? groupCreator.signedGames : signedGames
      );
    } else return groupCreator ? groupCreator.signedGames : signedGames;
  }

  return signedGames;
};
