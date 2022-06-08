import moment from "moment";
import { sharedConfig } from "shared/config/sharedConfig";
import { getTime } from "server/features/player-assignment/utils/getTime";
import { logger } from "server/utils/logger";

const { DIRECT_SIGNUP_START } = sharedConfig;

export const getDynamicStartingTime = async (): Promise<string> => {
  const timeNow = await getTime();

  const dynamicStartingTime = moment(timeNow)
    .add(DIRECT_SIGNUP_START, "minutes")
    .format();

  logger.info(`Using dynamic starting time: ${dynamicStartingTime}`);

  return dynamicStartingTime;
};
