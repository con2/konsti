import _ from "lodash";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import { saveGamePopularity } from "server/features/game/gameRepository";

export const updateWithSignups = async (
  users: User[],
  games: Game[]
): Promise<void> => {
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

  try {
    await Promise.all(
      games.map(async (game) => {
        if (groupedSignups[game.gameId]) {
          await saveGamePopularity(game.gameId, groupedSignups[game.gameId]);
        }
      })
    );
  } catch (error) {
    logger.error(`saveGamePopularity error: ${error}`);
    throw new Error("Update game popularity error");
  }
};
