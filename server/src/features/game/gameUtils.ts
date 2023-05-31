import _ from "lodash";
import dayjs, { Dayjs } from "dayjs";
import { findGames, removeGames } from "server/features/game/gameRepository";
import { GameDoc } from "server/typings/game.typings";
import { logger } from "server/utils/logger";
import {
  Game,
  GameWithUsernames,
  UserSignup,
} from "shared/typings/models/game";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";
import { findSettings } from "server/features/settings/settingsRepository";
import { Settings, SignupQuestion } from "shared/typings/models/settings";
import { getTime } from "server/features/player-assignment/utils/getTime";
import {
  delSignupsByGameIds,
  findSignups,
} from "server/features/signup/signupRepository";
import { Signup } from "server/features/signup/signup.typings";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const removeDeletedGames = async (
  updatedGames: readonly Game[]
): Promise<AsyncResult<number, MongoDbError>> => {
  logger.info("Remove deleted games");

  const currentGamesAsyncResult = await findGames();
  if (isErrorResult(currentGamesAsyncResult)) {
    return currentGamesAsyncResult;
  }

  const currentGames = unwrapResult(currentGamesAsyncResult);
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

    const delSignupsByGameIdsAsyncResult = await delSignupsByGameIds(
      deletedGameIds
    );
    if (isErrorResult(delSignupsByGameIdsAsyncResult)) {
      return delSignupsByGameIdsAsyncResult;
    }

    const removeGamesAsyncResult = await removeGames(deletedGameIds);
    if (isErrorResult(removeGamesAsyncResult)) {
      return removeGamesAsyncResult;
    }
  }

  return makeSuccessResult(deletedGames.length ?? 0);
};

export const enrichGames = async (
  games: readonly GameDoc[]
): Promise<GameWithUsernames[]> => {
  try {
    const signups = await findSignups();
    const settings = await findSettings();
    const currentTime = await getTime();

    return games.map((game) => {
      const signupQuestion = settings.signupQuestions.find(
        (message) => message.gameId === game.gameId
      );
      return {
        game: {
          ...game.toJSON<GameDoc>(),
          signupStrategy: getSignupStrategyForGame(game, settings, currentTime),
        },
        users: getSignupsForGame(signups, game.gameId, signupQuestion),
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

const getSignupsForGame = (
  signups: Signup[],
  gameId: string,
  signupQuestion?: SignupQuestion | undefined
): UserSignup[] => {
  const signupsForGame = signups.filter(
    (signup) => signup.game.gameId === gameId
  );

  const formattedSignupsForGame = signupsForGame.flatMap((signupForGame) => {
    return signupForGame.userSignups.map((userSignups) => {
      return {
        username: userSignups.username,
        signupMessage: getSignupMessage(signupQuestion, userSignups.message),
      };
    });
  });

  return formattedSignupsForGame;
};

const getSignupMessage = (
  signupQuestion: SignupQuestion | undefined,
  signupMessage: string
): string => {
  if (!signupQuestion || signupQuestion.private) {
    return "";
  }

  return signupMessage ?? "";
};
