import generator from "generate-serial-number";
import { logger } from "server/utils/logger";
import { SerialModel } from "server/features/serial/serialSchema";
import { SerialDoc, Serial } from "server/typings/serial.typings";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const saveSerials = async (
  count: number
): Promise<AsyncResult<SerialDoc[], MongoDbError>> => {
  const serialDocs = [] as SerialDoc[];
  // create serials
  for (let i = 1; i <= count; i += 1) {
    const serial = generator.generate(10);
    const rawSerials = serialDocs.map((serialDoc) => serialDoc.serial);

    const findSerialAsyncResult = await findSerial(serial);
    if (isErrorResult(findSerialAsyncResult)) {
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    const existingSerial = unwrapResult(findSerialAsyncResult);

    if (existingSerial || rawSerials.filter((s) => s === serial).length > 0) {
      i -= 1;
      continue;
    }
    serialDocs.push(
      new SerialModel({
        serial,
      })
    );
    logger.info(`${serial}`);
  }

  try {
    const response = await SerialModel.create(serialDocs);
    logger.info(
      `MongoDB: Serials data saved. (${serialDocs.length} serials saved)`
    );
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error saving serials data - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findSerial = async (
  serial: string
): Promise<AsyncResult<boolean, MongoDbError>> => {
  let response;
  try {
    response = await SerialModel.findOne({ serial }).lean<Serial>();
  } catch (error) {
    logger.error(`MongoDB: Error finding serial ${serial} - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (!response) {
    logger.debug(`MongoDB: Serial "${serial}" not found`);
    return makeSuccessResult(false);
  } else {
    logger.debug(`MongoDB: Found serial "${serial}"`);
    return makeSuccessResult(true);
  }
};
