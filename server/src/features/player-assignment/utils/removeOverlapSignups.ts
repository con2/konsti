import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; // ES 2015
import { logger } from "server/utils/logger";
import { UserSignedGames } from "server/typings/result.typings";
import { findUsers } from "server/features/user/userRepository";
import { AssignmentResult } from "shared/typings/models/result";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

dayjs.extend(isBetween);

export const removeOverlapSignups = async (
  results: readonly AssignmentResult[]
): Promise<Result<void, MongoDbError>> => {
  logger.debug("Find overlapping signups");
  const signupData: UserSignedGames[] = [];

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

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
    const saveSignedGamesResult = await saveSignedGames(signup);
    if (isErrorResult(saveSignedGamesResult)) {
      return saveSignedGamesResult;
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
