import dayjs from "dayjs";
import { GroupMember } from "shared/typings/models/groups";
import { Game } from "shared/typings/models/game";
import { getTimeNow } from "client/utils/getTimeNow";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { SelectedGame } from "shared/typings/models/user";

export const getUpcomingGames = (
  games: readonly Game[],
  offsetByHours = 0,
): readonly Game[] => {
  const timeNow = getTimeNow();

  const upcomingGames = games.filter((game) =>
    dayjs(game.startTime).add(offsetByHours, "hours").isSameOrAfter(timeNow),
  );

  return upcomingGames;
};

const getUpcomingSignedGames = (
  signedGames: readonly SelectedGame[],
): readonly SelectedGame[] => {
  const timeNow = getTimeNow();

  const upcomingGames = signedGames.filter((signedGame) => {
    return dayjs(signedGame.gameDetails.startTime)
      .add(1, "hours")
      .isAfter(timeNow);
  });

  return upcomingGames;
};

const getGroupCreator = (
  groupMembers: readonly GroupMember[],
): GroupMember | null => {
  const groupCreator = groupMembers.find(
    (member) => member.serial === member.groupCode,
  );
  if (!groupCreator) {
    return null;
  }
  return groupCreator;
};

interface GetSignedGamesParams {
  signedGames: readonly SelectedGame[];
  groupCode: string;
  serial: string;
  groupMembers: readonly GroupMember[];
  getAllGames: boolean;
}

export const getSignedGames = ({
  signedGames,
  groupCode,
  serial,
  groupMembers,
  getAllGames,
}: GetSignedGamesParams): readonly SelectedGame[] => {
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  if (isGroupCreator) {
    return getAllGames ? signedGames : getUpcomingSignedGames(signedGames);
  }

  if (!isGroupCreator) {
    const groupCreator = getGroupCreator(groupMembers);
    if (!groupCreator) {
      return [];
    }

    return getAllGames
      ? groupCreator.signedGames
      : getUpcomingSignedGames(groupCreator.signedGames);
  }

  return signedGames;
};

export const getUpcomingEnteredGames = (
  enteredGames: readonly SelectedGame[],
): readonly SelectedGame[] => {
  const timeNow = getTimeNow();

  const upcomingGames = enteredGames.filter((enteredGame) =>
    dayjs(enteredGame.gameDetails.startTime).add(1, "hours").isAfter(timeNow),
  );

  return upcomingGames;
};

export const getUpcomingFavorites = (
  favoritedGames: readonly Game[],
): readonly Game[] => {
  const timeNow = getTimeNow();

  const upcomingGames = favoritedGames.filter((favoritedGame) =>
    dayjs(favoritedGame.startTime).add(1, "hours").isAfter(timeNow),
  );

  return upcomingGames;
};
