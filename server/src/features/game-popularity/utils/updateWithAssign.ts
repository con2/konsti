import dayjs from "dayjs";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { padgAssignPlayers } from "server/features/player-assignment/padg/padgAssignPlayers";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import { Result } from "shared/typings/models/result";
import { saveGamePopularity } from "server/features/game/gameRepository";
import { Signup } from "server/features/signup/signup.typings";

export const updateWithAssign = async (
  users: readonly User[],
  games: readonly Game[],
  signups: readonly Signup[]
): Promise<void> => {
  const groupedGames = _.groupBy(games, (game) =>
    dayjs(game.startTime).format()
  );

  let results = [] as readonly Result[];

  _.forEach(groupedGames, (_value, startingTime) => {
    const assignmentResult = padgAssignPlayers(
      users,
      games,
      startingTime,
      signups
    );
    results = results.concat(assignmentResult.results);
  });

  const signedGames = results.flatMap(
    (result) => result.enteredGame.gameDetails
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
