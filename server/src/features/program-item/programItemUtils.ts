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
  ProgramType,
  ProgramItemSignupStrategy,
  UserSignup,
} from "shared/types/models/programItem";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { findSettings } from "server/features/settings/settingsRepository";
import { Settings, SignupQuestion } from "shared/types/models/settings";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
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
import { tooEarlyForLotterySignup } from "shared/utils/tooEarlyForLotterySignup";
import { UserGroup } from "shared/types/models/user";

export const removeDeletedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
): Promise<Result<number, MongoDbError>> => {
  logger.info("Remove deleted program items");

  const currentProgramItemsResult = await findProgramItems();
  if (isErrorResult(currentProgramItemsResult)) {
    return currentProgramItemsResult;
  }

  const currentProgramItems = unwrapResult(currentProgramItemsResult);
  const deletedProgramItems = differenceBy(
    currentProgramItems,
    updatedProgramItems,
    "programItemId",
  );

  if (deletedProgramItems.length > 0) {
    const deletedProgramItemIds = deletedProgramItems.map(
      (deletedProgramItem) => deletedProgramItem.programItemId,
    );

    logger.info(
      `Found ${
        deletedProgramItems.length
      } deleted program items to be removed: ${deletedProgramItemIds.join(", ")}`,
    );

    const delSignupDocumentsResult =
      await delDirectSignupDocumentsByProgramItemIds(deletedProgramItemIds);
    if (isErrorResult(delSignupDocumentsResult)) {
      return delSignupDocumentsResult;
    }

    const removeProgramItemsResult = await removeProgramItems(
      deletedProgramItemIds,
    );
    if (isErrorResult(removeProgramItemsResult)) {
      return removeProgramItemsResult;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return makeSuccessResult(deletedProgramItems.length ?? 0);
};

export const enrichProgramItems = async (
  programItems: readonly ProgramItemDoc[],
  userGroup: UserGroup | null,
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
  const enrichedProgramItems = programItems.map((programItem) => {
    const signupQuestion = settings.signupQuestions.find(
      (message) => message.programItemId === programItem.programItemId,
    );
    return {
      programItem: {
        ...programItem.toJSON<ProgramItemDoc>(),
        signupStrategy: getSignupStrategyForProgramItem(
          programItem,
          settings,
          currentTime,
        ),
      },
      users: getDirectSignupsForProgramItem(
        signups,
        programItem.programItemId,
        programItem.programType,
        userGroup,
        signupQuestion,
      ),
    };
  });

  return makeSuccessResult(enrichedProgramItems);
};

const getSignupStrategyForProgramItem = (
  programItem: ProgramItemDoc,
  settings: Settings,
  currentTime: Dayjs,
): ProgramItemSignupStrategy => {
  const start = dayjs(programItem.startTime);
  const { directSignupPhaseStart, twoPhaseSignupProgramTypes } = config.event();

  // lottery

  if (settings.signupStrategy === EventSignupStrategy.LOTTERY) {
    return ProgramItemSignupStrategy.LOTTERY;
  }

  // direct

  if (settings.signupStrategy === EventSignupStrategy.DIRECT) {
    return ProgramItemSignupStrategy.DIRECT;
  }

  // lottery+direct

  if (!twoPhaseSignupProgramTypes.includes(programItem.programType)) {
    return ProgramItemSignupStrategy.DIRECT;
  }

  if (tooEarlyForLotterySignup(programItem.startTime)) {
    return ProgramItemSignupStrategy.DIRECT;
  }

  const isAfterDirectSignupStarted = currentTime.isAfter(
    start.subtract(directSignupPhaseStart, "minutes"),
  );
  if (isAfterDirectSignupStarted) {
    return ProgramItemSignupStrategy.DIRECT;
  }

  return ProgramItemSignupStrategy.LOTTERY;
};

const getDirectSignupsForProgramItem = (
  directSignups: DirectSignupsForProgramItem[],
  programItemId: string,
  programType: ProgramType,
  userGroup: UserGroup | null,
  signupQuestion?: SignupQuestion | undefined,
): UserSignup[] => {
  const { hideParticipantListProgramTypes } = config.event();

  const directSignupsForProgramItem = directSignups.filter(
    (signup) => signup.programItem.programItemId === programItemId,
  );

  if (
    hideParticipantListProgramTypes.includes(programType) &&
    !(userGroup === UserGroup.ADMIN || userGroup === UserGroup.HELP)
  ) {
    return directSignupsForProgramItem.map((_directSignup) => ({
      username: "redacted",
      signupMessage: "redacted",
    }));
  }

  const formattedDirectSignupsForProgramItem =
    directSignupsForProgramItem.flatMap((directSignupForProgramItem) => {
      return directSignupForProgramItem.userSignups.map((userSignups) => {
        return {
          username: userSignups.username,
          signupMessage: getSignupMessage(signupQuestion, userSignups.message),
        };
      });
    });

  return formattedDirectSignupsForProgramItem;
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
