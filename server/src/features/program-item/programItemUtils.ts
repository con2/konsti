import dayjs, { Dayjs } from "dayjs";
import { removeProgramItems } from "server/features/program-item/programItemRepository";
import { logger } from "server/utils/logger";
import {
  ProgramItem,
  ProgramItemWithUserSignups,
  ProgramType,
  ProgramItemSignupStrategy,
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
  findDirectSignupsByProgramItemIds,
  resetDirectSignupsByProgramItemIds,
} from "server/features/direct-signup/directSignupRepository";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { Result, makeSuccessResult } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { tooEarlyForLotterySignup } from "shared/utils/tooEarlyForLotterySignup";
import { UserGroup } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { differenceBy } from "shared/utils/remedaExtend";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { queueCancelledDeletedEmails } from "server/features/notifications/queueCancelledDeletedEmails";
import { EventLogAction } from "shared/types/models/eventLog";

const getCancelledProgramItems = (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): {
  cancelledProgramItemIds: string[];
  signupTypeChangedProgramItemIds: string[];
} => {
  const currentProgramItemsMap = new Map(
    currentProgramItems.map((currentProgramItem) => [
      currentProgramItem.programItemId,
      currentProgramItem,
    ]),
  );

  const cancelledProgramItemIds: string[] = [];
  const signupTypeChangedProgramItemIds: string[] = [];

  for (const updatedProgramItem of updatedProgramItems) {
    const currentProgramItem = currentProgramItemsMap.get(
      updatedProgramItem.programItemId,
    );

    // Newly added program item not yet in DB
    if (!currentProgramItem) {
      continue;
    }

    // Program item marked as 'cancelled'
    const programItemCancelled =
      currentProgramItem.state === State.ACCEPTED &&
      updatedProgramItem.state === State.CANCELLED;

    // Program item no longer using 'konsti' signup type
    const programItemKonstiSignupRemoved =
      currentProgramItem.signupType === SignupType.KONSTI &&
      updatedProgramItem.signupType !== SignupType.KONSTI;

    // Cancellation takes precedence when both changed in the same update
    if (programItemCancelled) {
      cancelledProgramItemIds.push(updatedProgramItem.programItemId);
    } else if (programItemKonstiSignupRemoved) {
      signupTypeChangedProgramItemIds.push(updatedProgramItem.programItemId);
    }
  }

  return { cancelledProgramItemIds, signupTypeChangedProgramItemIds };
};

const getCancelledAndDeletedProgramItems = (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): {
  cancelledProgramItemIds: string[];
  signupTypeChangedProgramItemIds: string[];
  deletedProgramItemIds: string[];
} => {
  const { cancelledProgramItemIds, signupTypeChangedProgramItemIds } =
    getCancelledProgramItems(updatedProgramItems, currentProgramItems);

  if (cancelledProgramItemIds.length > 0) {
    logger.info(
      `Found ${
        cancelledProgramItemIds.length
      } cancelled program items: ${cancelledProgramItemIds.join(", ")}`,
    );
  }

  if (signupTypeChangedProgramItemIds.length > 0) {
    logger.info(
      `Found ${
        signupTypeChangedProgramItemIds.length
      } program items no longer using Konsti signup: ${signupTypeChangedProgramItemIds.join(
        ", ",
      )}`,
    );
  }

  const deletedProgramItemIds = differenceBy(
    currentProgramItems,
    updatedProgramItems,
    (programItem) => programItem.programItemId,
  ).map((p) => p.programItemId);

  if (deletedProgramItemIds.length > 0) {
    logger.info(
      `Found ${
        deletedProgramItemIds.length
      } deleted program items: ${deletedProgramItemIds.join(", ")}`,
    );
  }

  return {
    cancelledProgramItemIds,
    signupTypeChangedProgramItemIds,
    deletedProgramItemIds,
  };
};

export const handleCancelledDeletedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): Promise<Result<DirectSignupsForProgramItem[], MongoDbError>> => {
  const {
    cancelledProgramItemIds,
    signupTypeChangedProgramItemIds,
    deletedProgramItemIds,
  } = getCancelledAndDeletedProgramItems(
    updatedProgramItems,
    currentProgramItems,
  );

  const programItemTitlesById = new Map(
    [...updatedProgramItems, ...currentProgramItems].map((programItem) => [
      programItem.programItemId,
      programItem.title,
    ]),
  );

  const notifyUsersWithDirectSignupsResult = await notifyUsersWithDirectSignups(
    [
      ...cancelledProgramItemIds.map((programItemId) => ({
        programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELLED,
      })),
      ...signupTypeChangedProgramItemIds.map((programItemId) => ({
        programItemId,
        action: EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
      })),
      ...deletedProgramItemIds.map((programItemId) => ({
        programItemId,
        action: EventLogAction.PROGRAM_ITEM_DELETED,
      })),
    ],
    programItemTitlesById,
  );
  if (!notifyUsersWithDirectSignupsResult.ok) {
    return notifyUsersWithDirectSignupsResult;
  }
  const affectedDirectSignups = notifyUsersWithDirectSignupsResult.value;

  const removeDirectSignupsProgramItemIds = [
    ...cancelledProgramItemIds,
    ...signupTypeChangedProgramItemIds,
  ];
  if (removeDirectSignupsProgramItemIds.length > 0) {
    logger.info(
      "Remove direct signups if program item is cancelled or not using Konsti signup anymore",
    );
    const resetSignupDocumentsResult = await resetDirectSignupsByProgramItemIds(
      removeDirectSignupsProgramItemIds,
    );
    if (!resetSignupDocumentsResult.ok) {
      return resetSignupDocumentsResult;
    }
  }

  if (deletedProgramItemIds.length > 0) {
    logger.info(
      "Remove direct signups and signup document for deleted program items",
    );
    const delSignupDocumentsResult =
      await delDirectSignupDocumentsByProgramItemIds(deletedProgramItemIds);
    if (!delSignupDocumentsResult.ok) {
      return delSignupDocumentsResult;
    }

    logger.info("Remove deleted program items");
    const removeProgramItemsResult = await removeProgramItems(
      deletedProgramItemIds,
    );
    if (!removeProgramItemsResult.ok) {
      return removeProgramItemsResult;
    }
  }

  return makeSuccessResult(affectedDirectSignups);
};

export const enrichProgramItems = async (
  programItems: readonly ProgramItem[],
  userGroup: UserGroup | null,
): Promise<Result<ProgramItemWithUserSignups[], MongoDbError>> => {
  const settingsResult = await findSettings();
  if (!settingsResult.ok) {
    return settingsResult;
  }
  const settings = settingsResult.value;

  const signupsResult = await findDirectSignups();
  if (!signupsResult.ok) {
    return signupsResult;
  }
  const currentTimeResult = await getTimeNow();
  if (!currentTimeResult.ok) {
    return currentTimeResult;
  }
  const currentTime = currentTimeResult.value;

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
        signupsResult.value,
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
): ProgramItemSignupStrategy => {
  const parentStartTime = config
    .event()
    .startTimesByParentIds.get(programItem.parentId);

  const start = dayjs(parentStartTime ?? programItem.startTime);
  const { directSignupPhaseStart } = config.event();

  // lottery

  if (settings.signupStrategy === EventSignupStrategy.LOTTERY) {
    return ProgramItemSignupStrategy.LOTTERY;
  }

  // direct

  if (settings.signupStrategy === EventSignupStrategy.DIRECT) {
    return ProgramItemSignupStrategy.DIRECT;
  }

  // lottery+direct

  if (!isLotterySignupProgramItem(programItem)) {
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
          !(userGroup === UserGroup.ADMIN || userGroup === UserGroup.HELPER)
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

const notifyUsersWithDirectSignups = async (
  programItemActions: { programItemId: string; action: EventLogAction }[],
  programItemTitlesById: Map<string, string>,
): Promise<Result<DirectSignupsForProgramItem[], MongoDbError>> => {
  if (programItemActions.length === 0) {
    return makeSuccessResult([]);
  }
  const directSignupsResult = await findDirectSignupsByProgramItemIds(
    programItemActions.map(
      (programItemAction) => programItemAction.programItemId,
    ),
  );
  if (!directSignupsResult.ok) {
    return directSignupsResult;
  }
  const directSignups = directSignupsResult.value;

  const userUpdates = programItemActions.flatMap(
    ({ programItemId, action }) => {
      const directSignup = directSignups.find(
        (signup) => signup.programItemId === programItemId,
      );
      if (!directSignup) {
        return [];
      }
      return directSignup.userSignups.map((userSignup) => ({
        username: userSignup.username,
        programItemId,
        programItemStartTime: userSignup.signedToStartTime,
        createdAt: dayjs().toISOString(),
        action,
      }));
    },
  );

  if (userUpdates.length > 0) {
    const addEventLogItemsResult = await addEventLogItems(userUpdates);
    if (!addEventLogItemsResult.ok) {
      return addEventLogItemsResult;
    }

    queueCancelledDeletedEmails(userUpdates, programItemTitlesById);
  }

  return makeSuccessResult(directSignups);
};
