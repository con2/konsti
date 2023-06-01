import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; // ES 2015
import { logger } from "server/utils/logger";
import { UserSignedGames } from "server/typings/result.typings";
import { findUsers } from "server/features/user/userRepository";
import { Result } from "shared/typings/models/result";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

dayjs.extend(isBetween);

export const removeOverlapSignups = async (
  results: readonly Result[]
): Promise<AsyncResult<void, MongoDbError>> => {
  logger.debug("Find overlapping signups");
  const signupData: UserSignedGames[] = [];

  const usersAsyncResult = await findUsers();
  if (isErrorResult(usersAsyncResult)) {
    return usersAsyncResult;
  }

  const users = unwrapResult(usersAsyncResult);

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
      return !dayjs(signedGame.gameDetails.startTime).isBetween(
        dayjs(enteredGame.startTime).add(1, "minutes"),
        dayjs(enteredGame.endTime)
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

  const promises = signupData.map(async (signup) => {
    const saveSignedGamesAsyncResult = await saveSignedGames(signup);
    if (isErrorResult(saveSignedGamesAsyncResult)) {
      return saveSignedGamesAsyncResult;
    }
    return makeSuccessResult(undefined);
  });

  const saveResults = await Promise.all(promises);
  const someResultFailed = saveResults.some((saveResult) =>
    isErrorResult(saveResult)
  );
  if (someResultFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
