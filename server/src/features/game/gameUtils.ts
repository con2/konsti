import _ from "lodash";
import moment, { Moment } from "moment";
import { findGames } from "server/features/game/gameRepository";
import { GameModel } from "server/features/game/gameSchema";
import { removeInvalidSignupsFromUsers } from "server/features/player-assignment/utils/removeInvalidSignupsFromUsers";
import { GameDoc } from "server/typings/game.typings";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";
import { findUsers } from "server/features//user/userRepository";
import { User } from "shared/typings/models/user";
import { GameWithUsernames, UserSignup } from "shared/typings/api/games";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";
import { findSettings } from "server/features/settings/settingsRepository";
import { Settings } from "shared/typings/models/settings";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";

export const removeDeletedGames = async (
  updatedGames: readonly Game[]
): Promise<void> => {
  const currentGames = await findGames();

  const deletedGames = _.differenceBy(currentGames, updatedGames, "gameId");

  if (deletedGames && deletedGames.length !== 0) {
    logger.info(`Found ${deletedGames.length} deleted games, remove...`);

    try {
      await Promise.all(
        deletedGames.map(async (deletedGame) => {
          await GameModel.deleteOne({ gameId: deletedGame.gameId });
        })
      );
    } catch (error) {
      logger.error(`Error removing deleted games: ${error}`);
      return await Promise.reject(error);
    }

    await removeInvalidSignupsFromUsers();
  }
};

export const getGameById = async (gameId: string): Promise<GameDoc> => {
  let games: GameDoc[];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    throw error;
  }

  const foundGame = games.find((game) => game.gameId === gameId);

  if (!foundGame) throw new Error(`Game ${gameId} not found`);

  return foundGame;
};

const getTime = async (): Promise<Moment> => {
  if (process.env.SETTINGS !== "production") {
    const { testTime } = await findTestSettings();
    return moment(testTime);
  }

  return moment();
};

export const enrichGames = async (
  games: readonly GameDoc[]
): Promise<GameWithUsernames[]> => {
  try {
    const users = await findUsers();
    const settings = await findSettings();
    const currentTime = await getTime();

    return games.map((game) => {
      return {
        game: {
          ...game.toJSON(),
          signupStrategy: getSignupStrategyForGame(game, settings, currentTime),
        },
        users: getUsersForGame(users, game.gameId),
      };
    });
  } catch (error) {
    logger.error(`getGamesWithPlayers error: ${error}`);
    return [];
  }
};

const getSignupStrategyForGame = (
  game: GameDoc,
  settings: Settings,
  currentTime: Moment
): SignupStrategy => {
  const start = moment(game.startTime);
  const { DIRECT_SIGNUP_START } = sharedConfig;

  if (settings.signupStrategy !== SignupStrategy.ALGORITHM_AND_DIRECT) {
    return settings.signupStrategy;
  }

  const isAfterDirectSignupStarted = currentTime.isAfter(
    start.subtract(DIRECT_SIGNUP_START, "minutes")
  );
  if (isAfterDirectSignupStarted) {
    return SignupStrategy.DIRECT;
  }

  return SignupStrategy.ALGORITHM;
};

export const getUsersForGame = (
  users: User[],
  gameId: string
): UserSignup[] => {
  const usersForGame = users.filter(
    (user) =>
      user.enteredGames.filter(
        (enteredGame) => enteredGame.gameDetails.gameId === gameId
      ).length > 0
  );

  return usersForGame.map((user) => {
    const enteredGame = user.enteredGames.find(
      (game) => game.gameDetails.gameId === gameId
    );

    return {
      username: user.username,
      signupMessage: enteredGame?.message ?? "",
    };
  });
};
