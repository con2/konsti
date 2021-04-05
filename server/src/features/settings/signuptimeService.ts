import { saveSignupTime } from 'server/features/settings/settingsRepository';
import { ServerError } from 'shared/typings/api/errors';
import { PostSignupTimeResponse } from 'shared/typings/api/signup';

export const storeSignupTime = async (
  signupTime: string
): Promise<PostSignupTimeResponse | ServerError> => {
  try {
    const response = await saveSignupTime(signupTime);
    return {
      message: 'Signup time set success',
      status: 'success',
      signupTime: response.signupTime,
    };
  } catch (error) {
    return {
      message: 'Signup time set failure',
      status: 'error',
      code: 0,
    };
  }
};
