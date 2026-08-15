import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { logger } from "server/utils/logger";

export const getDynamicStartTime = async (): Promise<
  Result<string, MongoDbError>
> => {
  const { directSignupPhaseStart } = config.event();

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }

  const dynamicStartTime = timeNowResult.value
    .startOf("minute")
    .add(directSignupPhaseStart, "minutes")
    .toISOString();

  logger.info(`Using dynamic start time: ${dynamicStartTime}`);

  return makeSuccessResult(dynamicStartTime);
};
