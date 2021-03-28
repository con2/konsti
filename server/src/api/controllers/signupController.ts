import moment from 'moment';
import { logger } from 'server/utils/logger';
import { config } from 'server/config';
import { Signup } from 'server/typings/result.typings';
import { SignedGame } from 'server/typings/user.typings';
import { Status } from 'shared/typings/api/games';
import { saveSignup } from 'server/db/user/userService';

interface PostSignupResponse {
  message: string;
  status: Status;
  code?: number;
  error?: Error | string;
  signedGames?: readonly SignedGame[];
}

// Add signup data for user
export const postSignup = async (
  selectedGames: readonly SignedGame[],
  username: string,
  signupTime: string
): Promise<PostSignupResponse> => {
  logger.info('API call: POST /api/signup');

  if (!signupTime) {
    return {
      message: 'Signup failure',
      status: 'error',
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
      error,
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
      error,
    };
  }
};
