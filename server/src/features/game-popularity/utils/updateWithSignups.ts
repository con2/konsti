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
    }
    return user;
  });

  const signedGames = allUsers.flatMap((user) =>
    user.signedGames.map((signedGame) => signedGame.gameDetails)
  );

  const groupedSignups = _.countBy(signedGames, "gameId");

  const gamePopularityUpdates = games
    .map((game) => ({
      gameId: game.gameId,
      popularity: groupedSignups[game.gameId],
    }))
    .filter((popularityUpdate) => popularityUpdate.popularity);

  const saveGamePopularityResult = await saveGamePopularity(
    gamePopularityUpdates
  );

  if (isErrorResult(saveGamePopularityResult)) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
