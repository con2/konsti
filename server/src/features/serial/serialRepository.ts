import { z } from "zod";
import generator from "generate-serial-number";
import { logger } from "server/utils/logger";
import {
  SerialModel,
  SerialSchemaDb,
} from "server/features/serial/serialSchema";
import { Serial } from "server/types/serialTypes";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

export const removeSerials = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL serials from db");
  try {
    await SerialModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error removing serials: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSerials = async (
  count: number,
): Promise<Result<Serial[], MongoDbError>> => {
  const serials: Serial[] = [];
  // create serials
  for (let i = 1; i <= count; i += 1) {
    const serial = generator.generate(10);
    const rawSerials = serials.map((s) => s.serial);

    const findSerialResult = await findSerial(serial);
    if (isErrorResult(findSerialResult)) {
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    const existingSerial = unwrapResult(findSerialResult);

    if (existingSerial || rawSerials.includes(serial)) {
      i -= 1;
      continue;
    }
    serials.push(
      new SerialModel({
        serial,
      }) as Serial,
    );
    logger.info(`MongoDB: Created new serial: ${serial}`);
  }

  try {
    const response = await SerialModel.create(serials);
    logger.info(
      `MongoDB: Serials data saved. (${serials.length} serials saved)`,
    );

    const result = z.array(SerialSchemaDb).safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveSerials DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error("MongoDB: Error saving serials data: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findSerial = async (
  serial: string,
): Promise<Result<boolean, MongoDbError>> => {
  let response;
  try {
    response = await SerialModel.findOne({ serial }).lean();
  } catch (error) {
    logger.error(`MongoDB: Error finding serial ${serial}: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (!response) {
    logger.debug(`MongoDB: Serial ${serial} not found`);
    return makeSuccessResult(false);
  }
  logger.debug(`MongoDB: Found serial ${serial}`);
  return makeSuccessResult(true);
};
