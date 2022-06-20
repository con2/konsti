import { Dayjs } from "dayjs";
import { logger } from "server/utils/logger";
import { saveSerials } from "server/features/serial/serialRepository";
import { SerialDoc } from "server/typings/serial.typings";

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
      `Invalid signup time: timeNow: ${timeNow.format()}, startTime: ${startTime.format()}`
    );
    return false;
  }
  return true;
};

export const createSerial = async (): Promise<SerialDoc[]> => {
  return await saveSerials(1);
};
