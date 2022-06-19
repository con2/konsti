import { Moment } from "moment";
import { logger } from "server/utils/logger";
import { saveSerials } from "server/features/serial/serialRepository";
import { SerialDoc } from "server/typings/serial.typings";

interface IsValidSignupTimeParams {
  startTime: Moment;
  timeNow: Moment;
}

export const isValidSignupTime = ({
  startTime,
  timeNow,
}: IsValidSignupTimeParams): boolean => {
  if (startTime.isAfter(timeNow)) {
    logger.warn(
      `Invalid signup time: startTime: ${startTime.format()}, timeNow: ${timeNow.format()}`
    );
    return false;
  }
  return true;
};

export const createSerial = async (): Promise<SerialDoc[]> => {
  return await saveSerials(1);
};
