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
  isErrorResult,
  unwrapResult,
} from "shared/utils/result";
import { removeDeletedProgramItems } from "server/features/program-item/programItemUtils";
import { removeInvalidProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { MongoDbError } from "shared/types/api/errors";
import { createEmptyDirectSignupDocumentForProgramItems } from "server/features/direct-signup/directSignupRepository";
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
    logger.error("MongoDB: Error removing program items: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: Store program items to DB");

  const currentProgramItemsResult = await findProgramItems();
  if (isErrorResult(currentProgramItemsResult)) {
    return currentProgramItemsResult;
  }
  const currentProgramItems = unwrapResult(currentProgramItemsResult);

  // If program item was deleted, remove program item and direct signups
  const deletedProgramItemsResult = await removeDeletedProgramItems(
    updatedProgramItems,
    currentProgramItems,
  );
  if (isErrorResult(deletedProgramItemsResult)) {
    return deletedProgramItemsResult;
  }
  const deletedProgramItems = unwrapResult(deletedProgramItemsResult);

  const remainingProgramItems = currentProgramItems.filter(
    (currentItem) =>
      !deletedProgramItems.some(
        (deletedItem) =>
          currentItem.programItemId === deletedItem.programItemId,
      ),
  );

  // If program item was deleted, remove lottery signups and favorite program items
  const removeInvalidProgramItemsResult =
    await removeInvalidProgramItemsFromUsers(remainingProgramItems);
  if (isErrorResult(removeInvalidProgramItemsResult)) {
    return removeInvalidProgramItemsResult;
  }

  const updateMovedProgramItemsResult = await updateMovedProgramItems(
    updatedProgramItems,
    currentProgramItems,
  );
  if (isErrorResult(updateMovedProgramItemsResult)) {
    return updateMovedProgramItemsResult;
  }

  const bulkOps = updatedProgramItems.map((programItem) => {
    const newProgramItem: Omit<ProgramItem, "popularity"> = {
      programItemId: programItem.programItemId,
      title: programItem.title,
      description: programItem.description,
      location: programItem.location,
      startTime: programItem.startTime,
      mins: programItem.mins,
      tags: programItem.tags,
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
    logger.error("Error saving program items to DB: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  const newProgramItems = differenceBy(
    updatedProgramItems,
    currentProgramItems,
    (programItem) => programItem.programItemId,
  );

  logger.info(`MongoDB: Found ${newProgramItems.length} new program items`);

  // Create signup document for new program items
  if (newProgramItems.length > 0) {
    const newProgramItemIds = newProgramItems.map(
      (newProgramItem) => newProgramItem.programItemId,
    );
    const createEmptySignupResult =
      await createEmptyDirectSignupDocumentForProgramItems(newProgramItemIds);
    if (isErrorResult(createEmptySignupResult)) {
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
          "%s",
          new Error(
            `Error validating findProgramItems DB value: programItemId: ${programItem.programItemId}, ${JSON.stringify(result.error)}`,
          ),
        );
        return [];
      }
      return result.data;
    });

    return makeSuccessResult(programItems);
  } catch (error) {
    logger.error("MongoDB: Error fetching program items: %s", error);
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
        "%s",
        new Error(
          `Error validating findProgramItemById DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error("MongoDB: Error fetching programItemId: %s", error);
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
    logger.error("Error updating program item popularity: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
