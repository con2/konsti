import { Dayjs } from "dayjs";
import { MongoDbError } from "shared/types/api/errors";
import { Result } from "shared/utils/result";
import { saveSerials } from "server/features/serial/serialRepository";
import { Serial } from "server/types/serialTypes";
import { logger } from "server/utils/logger";

interface HasSignupEndedParams {
  signupEndTime: Dayjs;
  timeNow: Dayjs;
}

export const hasSignupEnded = ({
  signupEndTime,
  timeNow,
}: HasSignupEndedParams): boolean => {
  if (timeNow.isAfter(signupEndTime)) {
    logger.warn(
      `Invalid signup time: timeNow: ${timeNow.toISOString()}, signupEndTime: ${signupEndTime.toISOString()}`,
    );
    return true;
  }
  return false;
};

export const createSerial = async (): Promise<
  Result<Serial[], MongoDbError>
> => {
  return await saveSerials(1);
};
