import dayjs from "dayjs";
import _ from "lodash";
import { padgAssignPlayers } from "server/features/player-assignment/padg/padgAssignPlayers";
import { User } from "shared/types/models/user";
import { Game } from "shared/types/models/game";
import { saveGamePopularity } from "server/features/game/gameRepository";
import { Signup } from "server/features/signup/signupTypes";
import {
  Result,
  isErrorResult,
  isSuccessResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";

export const updateWithAssign = async (
  users: readonly User[],
  games: readonly Game[],
  signups: readonly Signup[],
): Promise<Result<void, MongoDbError | AssignmentError>> => {
  const gamesForStartTimes = _.groupBy(games, (game) =>
    dayjs(game.startTime).toISOString(),
  );

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return timeNowResult;
  }
  const timeNow = unwrapResult(timeNowResult);

  const startTimes = Object.keys(gamesForStartTimes).filter((startTime) =>
    dayjs(startTime).isSameOrAfter(timeNow),
  );

  const assignmentResultsResult = startTimes.map((startTime) => {
    return padgAssignPlayers(users, games, startTime, signups);
  });

  const someAssignmentFailed = assignmentResultsResult.some(
    (assignmentResult) => isErrorResult(assignmentResult),
  );
  if (someAssignmentFailed) {
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  const results = assignmentResultsResult.flatMap((result) => {
    if (isSuccessResult(result)) {
      return unwrapResult(result).results;
    }
    return [];
  });

  const signedGames = results.flatMap(
    (result) => result.enteredGame.gameDetails,
  );

  const groupedSignups = _.countBy(signedGames, "gameId");

  const gamePopularityUpdates = games
    .map((game) => ({
      gameId: game.gameId,
      popularity: groupedSignups[game.gameId],
    }))
    .filter((popularityUpdate) => popularityUpdate.popularity);

  const saveGamePopularityResult = await saveGamePopularity(
    gamePopularityUpdates,
  );

  if (isErrorResult(saveGamePopularityResult)) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
