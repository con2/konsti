import { MongoDbError } from "shared/types/api/errors";
import { Popularity, ProgramItem } from "shared/types/models/programItem";
import { differenceBy } from "shared/utils/remedaExtend";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { updateMovedProgramItems } from "server/features/assignment/utils/updateMovedProgramItems";
import {
  createEmptyDirectSignupDocumentForProgramItems,
  findDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import {
  getPassedOverProgramItems,
  removePassedOverLotterySignups,
} from "server/features/program-item/passedOverProgramItems";
import {
  ProgramItemModel,
  ProgramItemSchemaDb,
} from "server/features/program-item/programItemSchema";
import { handleCancelledDeletedProgramItems } from "server/features/program-item/programItemUtils";
import { logger } from "server/utils/logger";

export const removeProgramItems = async (
  programItemIds?: string[],
): Promise<Result<void, MongoDbError>> => {
  logger.info(
    `MongoDB: remove program items from db: ${programItemIds ? programItemIds.join(", ") : "ALL"}`,
  );

  try {
    await ProgramItemModel.deleteMany(
      programItemIds ? { programItemId: { $in: programItemIds } } : {},
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error removing program items", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: Store program items to DB");

  const currentProgramItemsResult = await findProgramItems();
  if (!currentProgramItemsResult.ok) {
    return currentProgramItemsResult;
  }
  const currentProgramItems = currentProgramItemsResult.value;

  // If program item was cancelled or deleted, remove program item and direct sign-ups
  const deletedProgramItemsResult = await handleCancelledDeletedProgramItems(
    updatedProgramItems,
    currentProgramItems,
  );
  if (!deletedProgramItemsResult.ok) {
    return deletedProgramItemsResult;
  }

  // If program item was cancelled or deleted, remove lottery sign-ups and favorite program items
  const removeCancelledDeletedProgramItemsFromUsersResult =
    await removeCancelledDeletedProgramItemsFromUsers({
      programItems: updatedProgramItems,
      currentProgramItems,
      notifyAffectedDirectSignups: deletedProgramItemsResult.value,
      notify: true,
    });
  if (!removeCancelledDeletedProgramItemsFromUsersResult.ok) {
    return removeCancelledDeletedProgramItemsFromUsersResult;
  }

  const updateMovedProgramItemsResult = await updateMovedProgramItems(
    updatedProgramItems,
    currentProgramItems,
  );
  if (!updateMovedProgramItemsResult.ok) {
    return updateMovedProgramItemsResult;
  }

  // Read before the write, so the marks below go in with the change that makes them true and the
  // program item is never stored as a lottery item without one. Direct sign-ups are settled by
  // now: the cancelled and deleted handling above is what last touched them.
  const directSignupsResult = await findDirectSignups();
  if (!directSignupsResult.ok) {
    return directSignupsResult;
  }
  const directSignups = directSignupsResult.value;

  const passedOverProgramItemsResult = await getPassedOverProgramItems(
    updatedProgramItems,
    currentProgramItems,
    directSignups,
  );
  if (!passedOverProgramItemsResult.ok) {
    return passedOverProgramItemsResult;
  }
  const passedOverProgramItems = passedOverProgramItemsResult.value;
  const passedOverProgramItemIds = new Set(
    passedOverProgramItems.map((programItem) => programItem.programItemId),
  );

  // Normally there is nothing to remove: a program item is passed over for holding direct
  // sign-ups, and having those means its lottery is over, so any sign-up for it is a past one
  // this leaves alone. Defence in depth for the orders that arrive out of the ordinary.
  //
  // Done before the decision is stored, so a failure here leaves the program item undecided and
  // the next import tries again. Recording it first and failing after would strand the sign-ups
  // for good: the item would be filtered out as already decided every time from then on.
  const removeLotterySignupsResult = await removePassedOverLotterySignups(
    passedOverProgramItems,
  );
  if (!removeLotterySignupsResult.ok) {
    return removeLotterySignupsResult;
  }

  const bulkOps = updatedProgramItems.map((programItem) => {
    const newProgramItem: Omit<
      ProgramItem,
      "popularity" | "lotteryRanForStartTime" | "passedOverForLottery"
    > = {
      programItemId: programItem.programItemId,
      parentId: programItem.parentId,
      title: programItem.title,
      description: programItem.description,
      location: programItem.location,
      startTime: programItem.startTime,
      mins: programItem.mins,
      tags: programItem.tags,
      ageGroups: programItem.ageGroups,
      genres: programItem.genres,
      styles: programItem.styles,
      languages: programItem.languages,
      endTime: programItem.endTime,
      people: programItem.people,
      minAttendance: programItem.minAttendance,
      maxAttendance: programItem.maxAttendance,
      gameSystem: programItem.gameSystem,
      shortDescription: programItem.shortDescription,
      revolvingDoor: programItem.revolvingDoor,
      programType: programItem.programType,
      contentWarnings: programItem.contentWarnings,
      otherAuthor: programItem.otherAuthor,
      accessibilityValues: programItem.accessibilityValues,
      otherAccessibilityInformation: programItem.otherAccessibilityInformation,
      entryFee: programItem.entryFee,
      signupType: programItem.signupType,
      state: programItem.state,
    };

    // Otherwise the import's to leave alone, so it is set here only for a program item this
    // save is what turns into a passed over one
    const passedOverForLottery = passedOverProgramItemIds.has(
      programItem.programItemId,
    )
      ? { passedOverForLottery: true }
      : {};

    return {
      updateOne: {
        filter: {
          programItemId: programItem.programItemId,
        },
        update: {
          ...newProgramItem,
          ...passedOverForLottery,
        },
        upsert: true,
      },
    };
  });

  try {
    await ProgramItemModel.bulkWrite(bulkOps);
    logger.debug("MongoDB: Program items saved to DB successfully");
  } catch (error) {
    logger.error(
      new Error("Error saving program items to DB", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  const newProgramItems = differenceBy(
    updatedProgramItems,
    currentProgramItems,
    (programItem) => programItem.programItemId,
  );

  logger.info(`MongoDB: Found ${newProgramItems.length} new program items`);

  // Create sign-up document for all program items missing sign-up document
  const programItemIdsWithSignupDoc = new Set(
    directSignups.map((directSignup) => directSignup.programItemId),
  );
  const directSignupDocMissingProgramItemIds = updatedProgramItems
    .filter(
      (updatedProgramItem) =>
        !programItemIdsWithSignupDoc.has(updatedProgramItem.programItemId),
    )
    .map((updatedProgramItem) => updatedProgramItem.programItemId);

  if (directSignupDocMissingProgramItemIds.length > 0) {
    const createEmptySignupResult =
      await createEmptyDirectSignupDocumentForProgramItems(
        directSignupDocMissingProgramItemIds,
      );
    if (!createEmptySignupResult.ok) {
      return createEmptySignupResult;
    }
  }

  return makeSuccessResult();
};

export const findProgramItems = async (): Promise<
  Result<ProgramItem[], MongoDbError>
> => {
  try {
    const response = await ProgramItemModel.find({}).lean();
    logger.debug("MongoDB: Find all program items");

    const programItems = response.flatMap((programItem) => {
      const result = ProgramItemSchemaDb.safeParse(programItem);
      if (!result.success) {
        logger.error(
          new Error(
            `Error validating findProgramItems DB value: programItemId: ${programItem.programItemId}`,
            { cause: result.error },
          ),
        );
        return [];
      }
      return result.data;
    });

    return makeSuccessResult(programItems);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error fetching program items", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findProgramItemById = async (
  programItemId: string,
): Promise<Result<ProgramItem, MongoDbError>> => {
  logger.debug(`MongoDB: Find program item with id ${programItemId}`);

  try {
    const response = await ProgramItemModel.findOne({
      programItemId,
    }).lean();
    if (!response) {
      return makeErrorResult(MongoDbError.PROGRAM_ITEM_NOT_FOUND);
    }
    const result = ProgramItemSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(`Error validating findProgramItemById DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error fetching programItemId", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface PopularityUpdate {
  programItemId: string;
  popularity: Popularity;
}

// Recorded rather than worked out later: whether a lottery will take a program item must not
// change as the clock moves past its sign-up window
export const savePassedOverForLottery = async (
  programItemIds: readonly string[],
): Promise<Result<void, MongoDbError>> => {
  if (programItemIds.length === 0) {
    return makeSuccessResult();
  }

  try {
    await ProgramItemModel.updateMany(
      { programItemId: { $in: programItemIds } },
      { passedOverForLottery: true },
    );
    logger.info(
      `MongoDB: Recorded ${programItemIds.length} program items as passed over for the lottery`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error recording program items as passed over", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// The start time each program item was sitting at when its lottery ran. A time rather than a
// flag, so one moved onto another slot afterwards can be told from one still where it was
// lotteried - and each item's own start time rather than the run's, because a batch's parent
// time is the same before and after a move and so could never tell the two apart.
export const saveLotteryRanForStartTime = async (
  programItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  if (programItems.length === 0) {
    return makeSuccessResult();
  }

  try {
    await ProgramItemModel.bulkWrite(
      programItems.map((programItem) => ({
        updateOne: {
          filter: { programItemId: programItem.programItemId },
          update: {
            lotteryRanForStartTime: new Date(programItem.startTime),
          },
        },
      })),
    );
    logger.info(
      `MongoDB: Marked ${programItems.length} program items as lotteried`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error marking program items as lotteried", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveProgramItemPopularity = async (
  popularityUpdates: PopularityUpdate[],
): Promise<Result<void, MongoDbError>> => {
  const bulkOps = popularityUpdates.map((popularityUpdate) => {
    return {
      updateOne: {
        filter: {
          programItemId: popularityUpdate.programItemId,
        },
        update: {
          popularity: popularityUpdate.popularity,
        },
      },
    };
  });

  try {
    await ProgramItemModel.bulkWrite(bulkOps);
    logger.info(
      `MongoDB: Updated popularity for ${popularityUpdates.length} program items`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("Error updating program item popularity", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
