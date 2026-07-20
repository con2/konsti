import { logger } from "server/utils/logger";
import {
  ProgramItemModel,
  ProgramItemSchemaDb,
} from "server/features/program-item/programItemSchema";
import { updateMovedProgramItems } from "server/features/assignment/utils/updateMovedProgramItems";
import { Popularity, ProgramItem } from "shared/types/models/programItem";
import {
  makeSuccessResult,
  Result,
  makeErrorResult,
} from "shared/utils/result";
import { handleCancelledDeletedProgramItems } from "server/features/program-item/programItemUtils";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { MongoDbError } from "shared/types/api/errors";
import {
  createEmptyDirectSignupDocumentForProgramItems,
  findDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { differenceBy } from "shared/utils/remedaExtend";

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

  // If program item was cancelled or deleted, remove program item and direct signups
  const deletedProgramItemsResult = await handleCancelledDeletedProgramItems(
    updatedProgramItems,
    currentProgramItems,
  );
  if (!deletedProgramItemsResult.ok) {
    return deletedProgramItemsResult;
  }

  // If program item was cancelled or deleted, remove lottery signups and favorite program items
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

  const bulkOps = updatedProgramItems.map((programItem) => {
    const newProgramItem: Omit<ProgramItem, "popularity"> = {
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

    return {
      updateOne: {
        filter: {
          programItemId: programItem.programItemId,
        },
        update: {
          ...newProgramItem,
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

  // Create signup document for all program items missing signup document
  const directSignupsResult = await findDirectSignups();
  if (!directSignupsResult.ok) {
    return directSignupsResult;
  }
  const directSignupDocMissingProgramItemIds = updatedProgramItems.flatMap(
    (updatedProgramItem) => {
      const found = directSignupsResult.value.some(
        (directSignup) =>
          directSignup.programItemId === updatedProgramItem.programItemId,
      );
      if (!found) {
        return updatedProgramItem.programItemId;
      }
      return [];
    },
  );

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
