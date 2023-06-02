import _ from "lodash";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import { saveGamePopularity } from "server/features/game/gameRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

export const updateWithSignups = async (
  users: User[],
  games: Game[]
): Promise<Result<void, MongoDbError>> => {
  const groupCreators = users.filter(
    (user) => user.groupCode !== "0" && user.groupCode === user.serial
  );

  const allUsers = users.map((user) => {
    const foundgroupCreator = groupCreators.find(
      (groupCreator) =>
        user.groupCode === groupCreator.groupCode &&
        user.serial !== groupCreator.serial
    );

    if (foundgroupCreator) {
      return { ...user, signedGames: foundgroupCreator.signedGames };
    } else return user;
  });

  const signedGames = allUsers.flatMap((user) =>
    user.signedGames.map((signedGame) => signedGame.gameDetails)
  );

  const groupedSignups = _.countBy(signedGames, "gameId");

  const promises = games.map(async (game) => {
    if (groupedSignups[game.gameId]) {
      const saveGamePopularityResult = await saveGamePopularity(
        game.gameId,
        groupedSignups[game.gameId]
      );
      if (isErrorResult(saveGamePopularityResult)) {
        return saveGamePopularityResult;
      }
    }
    return makeSuccessResult(undefined);
  });

  const results = await Promise.all(promises);
  const someUpdateFailed = results.some((result) => isErrorResult(result));

  if (someUpdateFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
