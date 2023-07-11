import { Dayjs } from "dayjs";
import { logger } from "server/utils/logger";
import { saveSerials } from "server/features/serial/serialRepository";
import { SerialDoc } from "server/typings/serial.typings";
import { Result } from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

interface IsValidSignupTimeParams {
  startTime: Dayjs;
  timeNow: Dayjs;
}

export const isValidSignupTime = ({
  startTime,
  timeNow,
}: IsValidSignupTimeParams): boolean => {
  if (timeNow.isAfter(startTime)) {
    logger.warn(
      `Invalid signup time: timeNow: ${timeNow.toISOString()}, startTime: ${startTime.toISOString()}`
    );
    return false;
  }
  return true;
};

export const createSerial = async (): Promise<
  Result<SerialDoc[], MongoDbError>
> => {
  return await saveSerials(1);
};
