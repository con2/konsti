import moment from 'moment';
import { config } from 'server/config';
import { logger } from 'server/utils/logger';

export const isValidSignupTime = (signupTime: string): boolean => {
  if (!config.enableSignupTimeCheck) return true;

  const timeNow = moment();

  if (moment(signupTime).isBefore(timeNow)) {
    const error = `Signup time ${moment(
      signupTime
    ).format()} does not match: too late`;

    logger.debug(error);

    return false;
  }

  return true;
};
