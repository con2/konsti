import { User, SignedGame } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { Result } from 'typings/result.typings';

export const buildSignupResults = (
  results: readonly number[][],
  signedGames: readonly Game[],
  players: readonly User[]
): readonly Result[] => {
  const signupResults: Result[] = [];

  // Build signup results
  for (let i = 0; i < results.length; i += 1) {
    // Row determines the game
    const selectedRow = results[i][0];

    // Player id
    const selectedPlayer = results[i][1];

    let attendanceRange = 0;

    // Figure what games the row numbers are
    for (let j = 0; j < signedGames.length; j += 1) {
      attendanceRange += signedGames[j].maxAttendance;

      // Found game
      if (selectedRow < attendanceRange) {
        const enteredGame = findEnteredGame(
          signedGames[j],
          players[selectedPlayer].signedGames
        );

        if (!enteredGame)
          throw new Error('Unable to find entered game from signed games');

        signupResults.push({
          username: players[selectedPlayer].username,
          enteredGame,
        });
        break;
      }
    }
  }
  return signupResults;
};

const findEnteredGame = (
  enteredGame: Game,
  signedGames: readonly SignedGame[]
): SignedGame | undefined => {
  return signedGames.find(
    (signedGame) => signedGame.gameDetails.gameId === enteredGame.gameId
  );
};
