import { differenceBy } from "lodash-es";
import dayjs, { Dayjs } from "dayjs";
import { findGames, removeGames } from "server/features/game/gameRepository";
import { GameDoc } from "server/types/gameTypes";
import { logger } from "server/utils/logger";
import { Game, GameWithUsernames, UserSignup } from "shared/types/models/game";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
import { findSettings } from "server/features/settings/settingsRepository";
import { Settings, SignupQuestion } from "shared/types/models/settings";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";
import {
  delSignupDocumentsByGameIds,
  findSignups,
} from "server/features/signup/signupRepository";
import { Signup } from "server/features/signup/signupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { tooEearlyForAlgorithmSignup } from "shared/utils/tooEearlyForAlgorithmSignup";

export const removeDeletedGames = async (
  updatedGames: readonly Game[],
): Promise<Result<number, MongoDbError>> => {
  logger.info("Remove deleted games");

  const currentGamesResult = await findGames();
  if (isErrorResult(currentGamesResult)) {
    return currentGamesResult;
  }

  const currentGames = unwrapResult(currentGamesResult);
  const deletedGames = differenceBy(currentGames, updatedGames, "gameId");

  if (deletedGames.length > 0) {
    const deletedGameIds = deletedGames.map(
      (deletedGame) => deletedGame.gameId,
    );

    logger.info(
      `Found ${
        deletedGames.length
      } deleted games to be removed: ${deletedGameIds.join(", ")}`,
    );

    const delSignupDocumentsResult =
      await delSignupDocumentsByGameIds(deletedGameIds);
    if (isErrorResult(delSignupDocumentsResult)) {
      return delSignupDocumentsResult;
    }

    const removeGamesResult = await removeGames(deletedGameIds);
    if (isErrorResult(removeGamesResult)) {
      return removeGamesResult;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return makeSuccessResult(deletedGames.length ?? 0);
};

export const enrichGames = async (
  games: readonly GameDoc[],
): Promise<Result<GameWithUsernames[], MongoDbError>> => {
  const settingsResult = await findSettings();
  if (isErrorResult(settingsResult)) {
    return settingsResult;
  }

  const settings = unwrapResult(settingsResult);

  const signupsResult = await findSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }

  const signups = unwrapResult(signupsResult);

  const currentTimeResult = await getTimeNow();
  if (isErrorResult(currentTimeResult)) {
    return currentTimeResult;
  }

  const currentTime = unwrapResult(currentTimeResult);
  const enrichedGames = games.map((game) => {
    const signupQuestion = settings.signupQuestions.find(
      (message) => message.gameId === game.gameId,
    );
    return {
      game: {
        ...game.toJSON<GameDoc>(),
        signupStrategy: getSignupStrategyForGame(game, settings, currentTime),
      },
      users: getSignupsForGame(signups, game.gameId, signupQuestion),
    };
  });

  return makeSuccessResult(enrichedGames);
};

const getSignupStrategyForGame = (
  game: GameDoc,
  settings: Settings,
  currentTime: Dayjs,
): SignupStrategy => {
  const start = dayjs(game.startTime);
  const { DIRECT_SIGNUP_START, twoPhaseSignupProgramTypes } = config.shared();

  if (settings.signupStrategy !== SignupStrategy.ALGORITHM_AND_DIRECT) {
    return settings.signupStrategy;
  }

  if (!twoPhaseSignupProgramTypes.includes(game.programType)) {
    return SignupStrategy.DIRECT;
  }

  if (tooEearlyForAlgorithmSignup(game.startTime)) {
    return SignupStrategy.DIRECT;
  }

  const isAfterDirectSignupStarted = currentTime.isAfter(
    start.subtract(DIRECT_SIGNUP_START, "minutes"),
  );
  if (isAfterDirectSignupStarted) {
    return SignupStrategy.DIRECT;
  }

  return SignupStrategy.ALGORITHM;
};

const getSignupsForGame = (
  signups: Signup[],
  gameId: string,
  signupQuestion?: SignupQuestion | undefined,
): UserSignup[] => {
  const signupsForGame = signups.filter(
    (signup) => signup.game.gameId === gameId,
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
  signupMessage: string,
): string => {
  if (!signupQuestion || signupQuestion.private) {
    return "";
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return signupMessage ?? "";
};
