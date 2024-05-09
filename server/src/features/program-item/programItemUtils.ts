import { differenceBy } from "lodash-es";
import dayjs, { Dayjs } from "dayjs";
import {
  findProgramItems,
  removeProgramItems,
} from "server/features/program-item/programItemRepository";
import { ProgramItemDoc } from "server/types/programItemTypes";
import { logger } from "server/utils/logger";
import {
  ProgramItem,
  ProgramItemWithUserSignups,
  UserSignup,
} from "shared/types/models/programItem";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
import { findSettings } from "server/features/settings/settingsRepository";
import { Settings, SignupQuestion } from "shared/types/models/settings";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";
import {
  delDirectSignupDocumentsByProgramItemIds,
  findDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { tooEearlyForAlgorithmSignup } from "shared/utils/tooEearlyForAlgorithmSignup";

export const removeDeletedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
): Promise<Result<number, MongoDbError>> => {
  logger.info("Remove deleted games");

  const currentGamesResult = await findProgramItems();
  if (isErrorResult(currentGamesResult)) {
    return currentGamesResult;
  }

  const currentGames = unwrapResult(currentGamesResult);
  const deletedGames = differenceBy(
    currentGames,
    updatedProgramItems,
    "programItemId",
  );

  if (deletedGames.length > 0) {
    const deletedProgramItemIds = deletedGames.map(
      (deletedGame) => deletedGame.programItemId,
    );

    logger.info(
      `Found ${
        deletedGames.length
      } deleted games to be removed: ${deletedProgramItemIds.join(", ")}`,
    );

    const delSignupDocumentsResult =
      await delDirectSignupDocumentsByProgramItemIds(deletedProgramItemIds);
    if (isErrorResult(delSignupDocumentsResult)) {
      return delSignupDocumentsResult;
    }

    const removeGamesResult = await removeProgramItems(deletedProgramItemIds);
    if (isErrorResult(removeGamesResult)) {
      return removeGamesResult;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return makeSuccessResult(deletedGames.length ?? 0);
};

export const enrichGames = async (
  programItems: readonly ProgramItemDoc[],
): Promise<Result<ProgramItemWithUserSignups[], MongoDbError>> => {
  const settingsResult = await findSettings();
  if (isErrorResult(settingsResult)) {
    return settingsResult;
  }

  const settings = unwrapResult(settingsResult);

  const signupsResult = await findDirectSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }

  const signups = unwrapResult(signupsResult);

  const currentTimeResult = await getTimeNow();
  if (isErrorResult(currentTimeResult)) {
    return currentTimeResult;
  }

  const currentTime = unwrapResult(currentTimeResult);
  const enrichedGames = programItems.map((programItem) => {
    const signupQuestion = settings.signupQuestions.find(
      (message) => message.programItemId === programItem.programItemId,
    );
    return {
      programItem: {
        ...programItem.toJSON<ProgramItemDoc>(),
        signupStrategy: getSignupStrategyForGame(
          programItem,
          settings,
          currentTime,
        ),
      },
      users: getSignupsForGame(
        signups,
        programItem.programItemId,
        signupQuestion,
      ),
    };
  });

  return makeSuccessResult(enrichedGames);
};

const getSignupStrategyForGame = (
  programItem: ProgramItemDoc,
  settings: Settings,
  currentTime: Dayjs,
): SignupStrategy => {
  const start = dayjs(programItem.startTime);
  const { DIRECT_SIGNUP_START, twoPhaseSignupProgramTypes } = config.shared();

  if (settings.signupStrategy !== SignupStrategy.ALGORITHM_AND_DIRECT) {
    return settings.signupStrategy;
  }

  if (!twoPhaseSignupProgramTypes.includes(programItem.programType)) {
    return SignupStrategy.DIRECT;
  }

  if (tooEearlyForAlgorithmSignup(programItem.startTime)) {
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
  directSignups: DirectSignupsForProgramItem[],
  programItemId: string,
  signupQuestion?: SignupQuestion | undefined,
): UserSignup[] => {
  const signupsForGame = directSignups.filter(
    (signup) => signup.programItem.programItemId === programItemId,
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
