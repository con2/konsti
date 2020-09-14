import _ from 'lodash';
import { GameWithPlayerCount, Game } from 'typings/game.typings';

export const getRemovedGame = (
  gamesWithTooFewPlayers: readonly GameWithPlayerCount[]
): Game => {
  // Get games with least players
  const sortedGamesWithTooFewPlayers = _.sortBy(gamesWithTooFewPlayers, [
    (game) => game.players,
  ]);

  // Find games that are tied to the lowest player count
  const tiedToLowest = [] as GameWithPlayerCount[];
  for (let i = 0; i < sortedGamesWithTooFewPlayers.length; i += 1) {
    if (
      sortedGamesWithTooFewPlayers[i].players ===
      _.first(sortedGamesWithTooFewPlayers)?.players
    )
      tiedToLowest.push(sortedGamesWithTooFewPlayers[i]);
  }

  const randomIndex = Math.floor(Math.random() * tiedToLowest.length);
  const removedGame = tiedToLowest[randomIndex].game;

  return removedGame;
};
