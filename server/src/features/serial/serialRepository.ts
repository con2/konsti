import generator from "generate-serial-number";
import { logger } from "server/utils/logger";
import { SerialModel } from "server/features/serial/serialSchema";
import { SerialDoc, Serial } from "server/types/serialTypes";
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
): Promise<Result<SerialDoc[], MongoDbError>> => {
  const serialDocs: SerialDoc[] = [];
  // create serials
  for (let i = 1; i <= count; i += 1) {
    const serial = generator.generate(10);
    const rawSerials = serialDocs.map((serialDoc) => serialDoc.serial);

    const findSerialResult = await findSerial(serial);
    if (isErrorResult(findSerialResult)) {
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    const existingSerial = unwrapResult(findSerialResult);

    if (existingSerial || rawSerials.includes(serial)) {
      i -= 1;
      continue;
    }
    serialDocs.push(
      new SerialModel({
        serial,
      }),
    );
    logger.info(`MongoDB: Created new serial: ${serial}`);
  }

  try {
    const response = await SerialModel.create(serialDocs);
    logger.info(
      `MongoDB: Serials data saved. (${serialDocs.length} serials saved)`,
    );
    return makeSuccessResult(response);
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
    response = await SerialModel.findOne({ serial }).lean<Serial>();
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
