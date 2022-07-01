import _ from "lodash";
import dayjs, { Dayjs } from "dayjs";
import { findGames, removeGames } from "server/features/game/gameRepository";
import { GameDoc } from "server/typings/game.typings";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";
import { findUsers } from "server/features//user/userRepository";
import { SelectedGame, User } from "shared/typings/models/user";
import { GameWithUsernames, UserSignup } from "shared/typings/api/games";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";
import { findSettings } from "server/features/settings/settingsRepository";
import { Settings, SignupMessage } from "shared/typings/models/settings";
import { getTime } from "server/features/player-assignment/utils/getTime";

export const removeDeletedGames = async (
  updatedGames: readonly Game[]
): Promise<number> => {
  logger.info("Remove deleted games");

  const currentGames = await findGames();

  const deletedGames = _.differenceBy(currentGames, updatedGames, "gameId");

  if (deletedGames.length > 0) {
    const deletedGameIds = deletedGames.map(
      (deletedGame) => deletedGame.gameId
    );

    logger.info(
      `Found ${
        deletedGames.length
      } deleted games to be removed: ${deletedGameIds.join(", ")}`
    );

    try {
      await removeGames(deletedGameIds);
    } catch (error) {
      logger.error(`Error removing deleted games: ${error}`);
      throw error;
    }
  }

  return deletedGames.length ?? 0;
};

export const enrichGames = async (
  games: readonly GameDoc[]
): Promise<GameWithUsernames[]> => {
  try {
    const users = await findUsers();
    const settings = await findSettings();
    const currentTime = await getTime();

    return games.map((game) => {
      const signupMessage = settings.signupMessages.find(
        (message) => message.gameId === game.gameId
      );
      return {
        game: {
          ...game.toJSON<GameDoc>(),
          signupStrategy: getSignupStrategyForGame(game, settings, currentTime),
        },
        users: getUsersForGame(users, game.gameId, signupMessage),
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
  currentTime: Dayjs
): SignupStrategy => {
  const start = dayjs(game.startTime);
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
  gameId: string,
  signupMessage?: SignupMessage | undefined
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
      signupMessage: getSignupMessage(signupMessage, enteredGame),
    };
  });
};

const getSignupMessage = (
  signupMessage: SignupMessage | undefined,
  enteredGame: SelectedGame | undefined
): string => {
  if (!signupMessage || signupMessage.private) {
    return "";
  }

  return enteredGame?.message ?? "";
};
