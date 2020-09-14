import _ from 'lodash';
import { PadgAssignResults } from 'typings/padgAssign.typings';
import { UserArray, EnteredGame, User } from 'typings/user.typings';
import { Result } from 'typings/result.typings';

export const formatResults = (
  assignResults: PadgAssignResults,
  playerGroups: readonly UserArray[]
): readonly Result[] => {
  const selectedPlayers = playerGroups
    .filter((playerGroup) => {
      const firstMember = _.first(playerGroup);

      if (!firstMember) {
        throw new Error('Padg assign: error getting first member');
      }

      return assignResults.find(
        (assignResult) =>
          (assignResult.id === firstMember.groupCode ||
            assignResult.id === firstMember.serial) &&
          assignResult.assignment !== -1
      );
    })
    .flat();

  const getEnteredGame = (player: User): EnteredGame | undefined => {
    return player.signedGames.find((signedGame) => {
      return assignResults.find(
        (assignResult) =>
          (assignResult.id === player.groupCode ||
            assignResult.id === player.serial) &&
          assignResult.assignment === signedGame.gameDetails.gameId
      );
    });
  };

  const results = selectedPlayers.reduce<Result[]>((acc, player) => {
    const enteredGame = getEnteredGame(player);
    if (enteredGame) {
      acc.push({
        username: player.username,
        enteredGame,
      });
    }
    return acc;
  }, []);

  return results;
};
