import moment from "moment";
import { logger } from "server/utils/logger";
import { UserSignedGames } from "server/typings/result.typings";
import { User } from "shared/typings/models/user";
import { findUsers } from "server/features/user/userRepository";
import { Result } from "shared/typings/models/result";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";

export const removeOverlapSignups = async (
  results: readonly Result[]
): Promise<void> => {
  logger.debug("Find overlapping signups");
  const signupData: UserSignedGames[] = [];

  let users: User[];
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(error);
    throw error;
  }

  results.map((result) => {
    const enteredGame = result.enteredGame.gameDetails;
    if (!enteredGame) {
      logger.error("removeOverlapSignups: Error finding entered game");
      return;
    }

    const signedUser = users.find((user) => user.username === result.username);
    if (!signedUser) {
      logger.error("removeOverlapSignups: Error finding signed user");
      return;
    }

    const newSignedGames = signedUser?.signedGames.filter((signedGame) => {
      // If signed game takes place during the length of entered game, cancel it
      return !moment(signedGame.gameDetails.startTime).isBetween(
        moment(enteredGame.startTime).add(1, "minutes"),
        moment(enteredGame.endTime)
      );
    });

    if (!newSignedGames) {
      logger.error("removeOverlapSignups: Error finding signed games");
      return;
    }

    signupData.push({
      username: signedUser.username,
      signedGames: newSignedGames,
    });
  });

  try {
    await Promise.all(
      signupData.map(async (signup) => {
        await saveSignedGames(signup);
      })
    );
  } catch (error) {
    throw new Error(`No assign results: saveSignup error: ${error}`);
  }
};
