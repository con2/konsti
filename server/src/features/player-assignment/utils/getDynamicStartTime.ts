import { getSharedConfig } from "shared/config/sharedConfig";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";
import { logger } from "server/utils/logger";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

const { DIRECT_SIGNUP_START } = getSharedConfig();

export const getDynamicStartTime = async (): Promise<
  Result<string, MongoDbError>
> => {
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
