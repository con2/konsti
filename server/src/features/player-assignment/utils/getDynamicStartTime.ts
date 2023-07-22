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

export const getDynamicStartTime = async (): Promise<
  Result<string, MongoDbError>
> => {
  const timeNowResult = await getTime();
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
