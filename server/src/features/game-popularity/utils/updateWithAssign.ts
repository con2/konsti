import dayjs from "dayjs";
import _ from "lodash";
import { padgAssignPlayers } from "server/features/player-assignment/padg/padgAssignPlayers";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import { AssignmentResult } from "shared/typings/models/result";
import { saveGamePopularity } from "server/features/game/gameRepository";
import { Signup } from "server/features/signup/signup.typings";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError, MongoDbError } from "shared/typings/api/errors";

export const updateWithAssign = async (
  users: readonly User[],
  games: readonly Game[],
  signups: readonly Signup[]
): Promise<AsyncResult<void, MongoDbError | AssignmentError>> => {
  const groupedGames = _.groupBy(games, (game) =>
    dayjs(game.startTime).format()
  );

  let results = [] as readonly AssignmentResult[];

  _.forEach(groupedGames, (_value, startingTime) => {
    const assignmentResultAsyncResult = padgAssignPlayers(
      users,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(assignmentResultAsyncResult)) {
      return assignmentResultAsyncResult;
    }
    const assignmentResult = unwrapResult(assignmentResultAsyncResult);
    results = results.concat(assignmentResult.results);
  });

  const signedGames = results.flatMap(
    (result) => result.enteredGame.gameDetails
  );

  const groupedSignups = _.countBy(signedGames, "gameId");

  const promises = games.map(async (game) => {
    if (groupedSignups[game.gameId]) {
      const saveGamePopularityAsyncResult = await saveGamePopularity(
        game.gameId,
        groupedSignups[game.gameId]
      );
      if (isErrorResult(saveGamePopularityAsyncResult)) {
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }
    }
    return makeSuccessResult(undefined);
  });

  const updateResults = await Promise.all(promises);
  const someUpdateFailed = updateResults.some((updateResult) =>
    isErrorResult(updateResult)
  );

  if (someUpdateFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
