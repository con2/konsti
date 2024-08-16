import { config } from "shared/config";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { logger } from "server/utils/logger";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

export const getDynamicStartTime = async (): Promise<
  Result<string, MongoDbError>
> => {
  const { DIRECT_SIGNUP_START } = config.event();

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return timeNowResult;
  }

  const timeNow = unwrapResult(timeNowResult);

  const dynamicStartTime = timeNow
    .startOf("minute")
    .add(DIRECT_SIGNUP_START, "minutes")
    .toISOString();

  logger.info(`Using dynamic start time: ${dynamicStartTime}`);

  return makeSuccessResult(dynamicStartTime);
};
