import { sharedConfig } from "shared/config/sharedConfig";
import { getTime } from "server/features/player-assignment/utils/getTime";
import { logger } from "server/utils/logger";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

const { DIRECT_SIGNUP_START } = sharedConfig;

export const getDynamicStartingTime = async (): Promise<
  AsyncResult<string, MongoDbError>
> => {
  const timeNowAsyncResult = await getTime();
  if (isErrorResult(timeNowAsyncResult)) {
    return timeNowAsyncResult;
  }

  const timeNow = unwrapResult(timeNowAsyncResult);

  const dynamicStartingTime = timeNow
    .startOf("minute")
    .add(DIRECT_SIGNUP_START, "minutes")
    .format();

  logger.info(`Using dynamic starting time: ${dynamicStartingTime}`);

  return makeSuccessResult(dynamicStartingTime);
};
