import _ from 'lodash';
import moment from 'moment';
import { ListItem } from 'typings/padgAssign.typings';
import { UserArray, SignedGame } from 'typings/user.typings';

export const getList = (
  playerGroups: readonly UserArray[],
  startingTime: string
): ListItem[] => {
  return playerGroups.flatMap((playerGroup) => {
    const firstMember = _.first(playerGroup);
    if (!firstMember)
      throw new Error('Padg assign: error getting first member');
    return firstMember.signedGames
      .filter(
        (signedGame) =>
          moment(signedGame.time).format() === moment(startingTime).format()
      )
      .map((signedGame) => {
        return {
          id:
            firstMember.groupCode !== '0'
              ? firstMember.groupCode
              : firstMember.serial,
          size: playerGroup.length,
          event: signedGame.gameDetails.gameId,
          gain: getGain(signedGame),
        };
      });
  });
};

const getGain = (signedGame: SignedGame): number => {
  switch (signedGame.priority) {
    case 1:
      return 1;
    case 2:
      return 0.5;
    case 3:
      return 0.33;
  }

  throw new Error(`Invalid signup priority: ${signedGame.priority}`);
};
