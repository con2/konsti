import moment from 'moment';
import _ from 'lodash';
import { UserArray } from 'typings/user.typings';
import { Group } from 'typings/padgAssign.typings';

export const getGroups = (
  playerGroups: readonly UserArray[],
  startingTime: string
): Group[] => {
  return playerGroups.map((playerGroup) => {
    const firstMember = _.first(playerGroup);
    if (!firstMember)
      throw new Error('Padg assign: error getting first member');
    return {
      id:
        firstMember.groupCode !== '0'
          ? firstMember.groupCode
          : firstMember.serial,
      size: playerGroup.length,
      pref: firstMember.signedGames
        .filter(
          (signedGame) =>
            moment(signedGame.time).format() === moment(startingTime).format()
        )
        .map((signedGame) => signedGame.gameDetails.gameId),
    };
  });
};
