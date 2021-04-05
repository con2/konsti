import moment from 'moment';
import { logger } from 'server/utils/logger';
import { config } from 'server/config';
import { Signup } from 'server/typings/result.typings';
import { SignedGame } from 'server/typings/user.typings';
import { saveSignup } from 'server/features/user/userRepository';
import { PostSignupResponse } from 'shared/typings/api/signup';
import { ServerError } from 'shared/typings/api/errors';

export const storeSignup = async (
  selectedGames: readonly SignedGame[],
  username: string,
  signupTime: string
): Promise<PostSignupResponse | ServerError> => {
  if (!signupTime) {
    return {
      message: 'Signup failure',
      status: 'error',
      code: 0,
    };
  }

  const timeNow = moment();
  if (config.enableSignupTimeCheck && moment(signupTime).isBefore(timeNow)) {
    const error = `Signup time ${moment(
      signupTime
    ).format()} does not match: too late`;

    logger.debug(error);
    return {
      code: 41,
      message: 'Signup failure',
      status: 'error',
    };
  }

  const modifiedSignupData: Signup = {
    signedGames: selectedGames,
    username,
  };

  try {
    const response = await saveSignup(modifiedSignupData);
    return {
      message: 'Signup success',
      status: 'success',
      signedGames: response.signedGames,
    };
  } catch (error) {
    return {
      message: 'Signup failure',
      status: 'error',
      code: 0,
    };
  }
};
