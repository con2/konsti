import dayjs from "dayjs";
import { GroupMember } from "shared/typings/api/groups";
import { Game, ProgramType } from "shared/typings/models/game";
import { getTime } from "client/utils/getTime";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { SelectedGame } from "shared/typings/models/user";

export const getUpcomingGames = (
  games: readonly Game[],
  offsetByHours = 0
): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = games.filter((game) =>
    dayjs(game.startTime).add(offsetByHours, "hours").isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingSignedGames = (
  signedGames: readonly SelectedGame[]
): readonly SelectedGame[] => {
  const timeNow = getTime();

  const upcomingGames = signedGames.filter((signedGame) => {
    return dayjs(signedGame.gameDetails.startTime)
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

interface GetSignedGamesParams {
  signedGames: readonly SelectedGame[];
  groupCode: string;
  serial: string;
  groupMembers: readonly GroupMember[];
  activeProgramType: ProgramType;
  getAllGames: boolean;
}

export const getSignedGames = ({
  signedGames,
  groupCode,
  serial,
  groupMembers,
  activeProgramType,
  getAllGames,
}: GetSignedGamesParams): readonly SelectedGame[] => {
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  if (isGroupCreator) {
    return getAllGames ? signedGames : getUpcomingSignedGames(signedGames);
  }

  if (!isGroupCreator) {
    const groupCreator = getGroupCreator(groupMembers);
    if (!groupCreator) return [];

    const groupCreatorActiveSignedGames = groupCreator.signedGames.filter(
      (signedGame) => signedGame.gameDetails.programType === activeProgramType
    );

    return getAllGames
      ? groupCreatorActiveSignedGames
      : getUpcomingSignedGames(groupCreatorActiveSignedGames);
  }

  return signedGames;
};

export const getUpcomingEnteredGames = (
  enteredGames: readonly SelectedGame[]
): readonly SelectedGame[] => {
  const timeNow = getTime();

  const upcomingGames = enteredGames.filter((enteredGame) =>
    dayjs(enteredGame.gameDetails.startTime).add(1, "hours").isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingFavorites = (
  favoritedGames: readonly Game[]
): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = favoritedGames.filter((favoritedGame) =>
    dayjs(favoritedGame.startTime).add(1, "hours").isAfter(timeNow)
  );

  return upcomingGames;
};
