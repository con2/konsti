import moment from 'moment';
import { GroupMember } from 'shared/typings/api/groups';
import { Game } from 'shared/typings/models/game';
import { getTime } from 'client/utils/getTime';
import { isGroupLeader } from 'client/views/group/GroupView';
import { SelectedGame } from 'shared/typings/models/user';

export const getUpcomingGames = (games: readonly Game[]): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = games.filter((game) =>
    moment(game.startTime).isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingSignedGames = (
  signedGames: readonly SelectedGame[]
): readonly SelectedGame[] => {
  const timeNow = getTime();

  const upcomingGames = signedGames.filter((signedGame) => {
    return moment(signedGame.gameDetails.startTime)
      .add(1, 'hours')
      .isAfter(timeNow);
  });

  return upcomingGames;
};

const getGroupLeader = (
  groupMembers: readonly GroupMember[]
): GroupMember | null => {
  const groupLeader = groupMembers.find(
    (member) => member.serial === member.groupCode
  );
  if (!groupLeader) return null;
  return groupLeader;
};

export const getSignedGames = (
  signedGames: readonly SelectedGame[],
  groupCode: string,
  serial: string,
  groupMembers: readonly GroupMember[],
  getAllGames: boolean = true
): readonly SelectedGame[] => {
  if (isGroupLeader(groupCode, serial)) {
    return !getAllGames ? getUpcomingSignedGames(signedGames) : signedGames;
  }

  if (!isGroupLeader(groupCode, serial)) {
    const groupLeader = getGroupLeader(groupMembers);

    if (!getAllGames) {
      return getUpcomingSignedGames(
        groupLeader ? groupLeader.signedGames : signedGames
      );
    } else {
      return groupLeader ? groupLeader.signedGames : signedGames;
    }
  }

  return signedGames;
};

export const getUpcomingEnteredGames = (
  enteredGames: readonly SelectedGame[]
): readonly SelectedGame[] => {
  const timeNow = getTime();

  const upcomingGames = enteredGames.filter((enteredGame) =>
    moment(enteredGame.gameDetails.startTime).add(1, 'hours').isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingFavorites = (
  favoritedGames: readonly Game[]
): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = favoritedGames.filter((favoritedGame) =>
    moment(favoritedGame.startTime).add(1, 'hours').isAfter(timeNow)
  );

  return upcomingGames;
};
