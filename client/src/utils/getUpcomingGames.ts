import dayjs from "dayjs";
import { GroupMember } from "shared/types/models/groups";
import { Game } from "shared/types/models/game";
import { getTimeNow } from "client/utils/getTimeNow";
import { SelectedGame } from "shared/types/models/user";

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
    (member) => member.groupCreatorCode === member.groupCode,
  );
  if (!groupCreator) {
    return null;
  }
  return groupCreator;
};

interface GetSignedGamesParams {
  signedGames: readonly SelectedGame[];
  isGroupCreator: boolean;
  groupMembers: readonly GroupMember[];
  isInGroup: boolean;
  getAllGames: boolean;
}

export const getSignedGames = ({
  signedGames,
  isGroupCreator,
  groupMembers,
  isInGroup,
  getAllGames,
}: GetSignedGamesParams): readonly SelectedGame[] => {
  if (isGroupCreator || !isInGroup) {
    return getAllGames ? signedGames : getUpcomingSignedGames(signedGames);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
