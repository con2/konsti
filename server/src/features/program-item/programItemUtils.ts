import dayjs, { Dayjs } from "dayjs";
import { removeProgramItems } from "server/features/program-item/programItemRepository";
import { logger } from "server/utils/logger";
import {
  ProgramItem,
  ProgramItemWithUserSignups,
  ProgramType,
  SignupStrategy,
  SignupType,
  State,
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
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { differenceBy } from "shared/utils/remedaExtend";

const getCanceledProgramItems = (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): readonly ProgramItem[] => {
  const currentProgramItemsMap = new Map(
    currentProgramItems.map((currentProgramItem) => [
      currentProgramItem.programItemId,
      currentProgramItem,
    ]),
  );

  const canceledProgramItems = updatedProgramItems.filter(
    (updatedProgramItem) => {
      const currentProgramItem = currentProgramItemsMap.get(
        updatedProgramItem.programItemId,
      );

      if (!currentProgramItem) {
        return false;
      }

      // Program item marked as 'cancelled'
      const programItemCancelled =
        currentProgramItem.state === State.ACCEPTED &&
        updatedProgramItem.state === State.CANCELLED;

      // Program item no longer using 'konsti' signup type
      const programItemKonstiSignupRemoved =
        currentProgramItem.signupType === SignupType.KONSTI &&
        updatedProgramItem.signupType !== SignupType.KONSTI;

      return programItemCancelled || programItemKonstiSignupRemoved;
    },
  );

  return canceledProgramItems;
};

export const handleCanceledDeletedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): Promise<
  Result<{ cancelled: string[]; deleted: string[] }, MongoDbError>
> => {
  const canceledProgramItemIds = getCanceledProgramItems(
    updatedProgramItems,
    currentProgramItems,
  ).map((p) => p.programItemId);

  if (canceledProgramItemIds.length > 0) {
    logger.info(
      `Found ${
        canceledProgramItemIds.length
      } canceled program items: ${canceledProgramItemIds.join(", ")}`,
    );
  }

  const deletedProgramItemIds = differenceBy(
    currentProgramItems,
    updatedProgramItems,
    (programItem) => programItem.programItemId,
  ).map((p) => p.programItemId);

  if (canceledProgramItemIds.length > 0) {
    logger.info(
      `Found ${
        canceledProgramItemIds.length
      } deleted program items: ${canceledProgramItemIds.join(", ")}`,
    );
  }

  const removeDirectSignupProgramItemIds = [
    ...canceledProgramItemIds,
    ...deletedProgramItemIds,
  ];

  if (removeDirectSignupProgramItemIds.length > 0) {
    logger.info("Remove direct signups for canceled and deleted program items");
    const delSignupDocumentsResult =
      await delDirectSignupDocumentsByProgramItemIds(
        removeDirectSignupProgramItemIds,
      );
    if (isErrorResult(delSignupDocumentsResult)) {
      return delSignupDocumentsResult;
    }
  }

  if (deletedProgramItemIds.length > 0) {
    logger.info("Remove deleted program items");
    const removeProgramItemsResult = await removeProgramItems(
      deletedProgramItemIds,
    );
    if (isErrorResult(removeProgramItemsResult)) {
      return removeProgramItemsResult;
    }
  }

  return makeSuccessResult({
    cancelled: canceledProgramItemIds,
    deleted: deletedProgramItemIds,
  });
};

export const enrichProgramItems = async (
  programItems: readonly ProgramItem[],
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
        ...programItem,
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
  programItem: ProgramItem,
  settings: Settings,
  currentTime: Dayjs,
): SignupStrategy => {
  const start = dayjs(programItem.startTime);
  const { directSignupPhaseStart } = config.event();

  // lottery

  if (settings.signupStrategy === EventSignupStrategy.LOTTERY) {
    return SignupStrategy.LOTTERY;
  }

  // direct

  if (settings.signupStrategy === EventSignupStrategy.DIRECT) {
    return SignupStrategy.DIRECT;
  }

  // lottery+direct

  if (!isLotterySignupProgramItem(programItem)) {
    return SignupStrategy.DIRECT;
  }

  if (tooEarlyForLotterySignup(programItem.startTime)) {
    return SignupStrategy.DIRECT;
  }

  const isAfterDirectSignupStarted = currentTime.isAfter(
    start.subtract(directSignupPhaseStart, "minutes"),
  );
  if (isAfterDirectSignupStarted) {
    return SignupStrategy.DIRECT;
  }

  return SignupStrategy.LOTTERY;
};

const getDirectSignupsForProgramItem = (
  directSignups: DirectSignupsForProgramItem[],
  programItemId: string,
  programType: ProgramType,
  userGroup: UserGroup | null,
  signupQuestion?: SignupQuestion,
): UserSignup[] => {
  const { hideParticipantListProgramTypes } = config.event();

  const directSignupsForProgramItem = directSignups.filter(
    (signup) => signup.programItemId === programItemId,
  );

  const formattedDirectSignupsForProgramItem =
    directSignupsForProgramItem.flatMap((directSignupForProgramItem) => {
      return directSignupForProgramItem.userSignups.map((userSignups) => {
        if (
          hideParticipantListProgramTypes.includes(programType) &&
          !(userGroup === UserGroup.ADMIN || userGroup === UserGroup.HELP)
        ) {
          return {
            username: "redacted",
            signupMessage: "redacted",
          };
        }
        return {
          username: userSignups.username,
          signupMessage: getSignupMessage(signupQuestion, userSignups.message),
        };
      });
    });

  return formattedDirectSignupsForProgramItem;
};

export const getSignupMessage = (
  signupQuestion: SignupQuestion | undefined,
  signupMessage: string,
): string => {
  if (!signupQuestion || signupQuestion.private) {
    return "";
  }

  return signupMessage;
};
