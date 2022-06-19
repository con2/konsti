import moment from "moment";
import { logger } from "server/utils/logger";
import { saveSerials } from "server/features/serial/serialRepository";
import { SerialDoc } from "server/typings/serial.typings";
import { getTime } from "server/features/player-assignment/utils/getTime";

export const isValidSignupTime = async (
  signupTime: string
): Promise<boolean> => {
  const timeNow = await getTime();

  if (moment(signupTime).isBefore(timeNow)) {
    const error = `Signup time ${moment(
      signupTime
    ).format()} does not match: too late`;

    logger.debug(error);

    return false;
  }

  return true;
};

export const createSerial = async (): Promise<SerialDoc[]> => {
  return await saveSerials(1);
};
