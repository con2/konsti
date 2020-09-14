import moment from 'moment';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { Signup, Result } from 'typings/result.typings';
import { SignedGame, User } from 'typings/user.typings';

export const removeOverlapSignups = async (
  results: readonly Result[]
): Promise<void> => {
  logger.debug('Find overlapping signups');
  const signupData: Signup[] = [];

  let players: User[];
  try {
    players = await db.user.findUsers();
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }

  results.forEach((result) => {
    const enteredGame = result.enteredGame.gameDetails;

    if (!enteredGame) return new Error('Error finding entered game');

    const signedPlayer = players.find(
      (player) => player.username === result.username
    );

    if (!signedPlayer) return new Error('Error finding signed player');

    const newSignedGames = [] as SignedGame[];

    if (signedPlayer?.signedGames) {
      signedPlayer.signedGames.forEach((signedGame) => {
        // If signed game takes place during the length of entered game, cancel it
        if (
          moment(signedGame.gameDetails.startTime).isBetween(
            moment(enteredGame.startTime).add(1, 'minutes'),
            moment(enteredGame.endTime)
          )
        ) {
          // Remove this signup
          logger.debug(
            `Signed game "${signedGame.gameDetails.title}" starts at ${moment(
              signedGame.gameDetails.startTime
            ).format()}`
          );

          logger.debug(
            `Entered game "${enteredGame.title}" ends at ${moment(
              enteredGame.endTime
            ).format()}`
          );
          logger.debug(`=> Remove signup "${signedGame.gameDetails.title}"`);
        } else {
          newSignedGames.push(signedGame);
        }
      });
    }

    signupData.push({
      username: signedPlayer.username,
      signedGames: newSignedGames,
    });
  });

  try {
    await Promise.all(
      signupData.map(async (signup) => {
        await db.user.saveSignup(signup);
      })
    );
  } catch (error) {
    throw new Error(`No assign results: saveSignup error: ${error}`);
  }
};
