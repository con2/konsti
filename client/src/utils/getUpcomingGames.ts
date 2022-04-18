import moment from "moment";
import { GroupMember } from "shared/typings/api/groups";
import { Game } from "shared/typings/models/game";
import { getTime } from "client/utils/getTime";
import { getIsGroupCreator } from "client/views/group/GroupView";
import { SelectedGame } from "shared/typings/models/user";

export const getUpcomingGames = (
  games: readonly Game[],
  offsetByHours = 0
): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = games.filter((game) =>
    moment(game.startTime).add(offsetByHours, "hours").isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingSignedGames = (
  signedGames: readonly SelectedGame[]
): readonly SelectedGame[] => {
  const timeNow = getTime();

  const upcomingGames = signedGames.filter((signedGame) => {
    return moment(signedGame.gameDetails.startTime)
      .add(1, "hours")
      .isAfter(timeNow);
  });

  return upcomingGames;
};

const getGroupCreator = (
  groupMembers: readonly GroupMember[]
): GroupMember | null => {
  const groupCreator = groupMembers.find(
    (member) => member.serial === member.groupCode
  );
  if (!groupCreator) return null;
  return groupCreator;
};

export const getSignedGames = (
  signedGames: readonly SelectedGame[],
  groupCode: string,
  serial: string,
  groupMembers: readonly GroupMember[],
  getAllGames = true
): readonly SelectedGame[] => {
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  if (isGroupCreator) {
    return !getAllGames ? getUpcomingSignedGames(signedGames) : signedGames;
  }

  if (!isGroupCreator) {
    const groupCreator = getGroupCreator(groupMembers);

    if (!getAllGames) {
      return getUpcomingSignedGames(
        groupCreator ? groupCreator.signedGames : signedGames
      );
    } else {
      return groupCreator ? groupCreator.signedGames : signedGames;
    }
  }

  return signedGames;
};

export const getUpcomingEnteredGames = (
  enteredGames: readonly SelectedGame[]
): readonly SelectedGame[] => {
  const timeNow = getTime();

  const upcomingGames = enteredGames.filter((enteredGame) =>
    moment(enteredGame.gameDetails.startTime).add(1, "hours").isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingFavorites = (
  favoritedGames: readonly Game[]
): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = favoritedGames.filter((favoritedGame) =>
    moment(favoritedGame.startTime).add(1, "hours").isAfter(timeNow)
  );

  return upcomingGames;
};
