import { isAfter } from "date-fns";
import { MongoDbError } from "shared/types/api/errors";
import { Result } from "shared/utils/result";
import { saveSerials } from "server/features/serial/serialRepository";
import { Serial } from "server/types/serialTypes";
import { logger } from "server/utils/logger";

interface HasSignupEndedParams {
  signupEndTime: Date;
  timeNow: Date;
}

export const hasSignupEnded = ({
  signupEndTime,
  timeNow,
}: HasSignupEndedParams): boolean => {
  if (isAfter(timeNow, signupEndTime)) {
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
