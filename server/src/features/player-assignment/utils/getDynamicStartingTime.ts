import { sharedConfig } from "shared/config/sharedConfig";
import { getTime } from "server/features/player-assignment/utils/getTime";
import { logger } from "server/utils/logger";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

const { DIRECT_SIGNUP_START } = sharedConfig;

export const getDynamicStartingTime = async (): Promise<
  Result<string, MongoDbError>
> => {
  const timeNowResult = await getTime();
  if (isErrorResult(timeNowResult)) {
    return timeNowResult;
  }

  const timeNow = unwrapResult(timeNowResult);

  const dynamicStartingTime = timeNow
    .startOf("minute")
    .add(DIRECT_SIGNUP_START, "minutes")
    .format();

  logger.info(`Using dynamic starting time: ${dynamicStartingTime}`);

  return makeSuccessResult(dynamicStartingTime);
};
