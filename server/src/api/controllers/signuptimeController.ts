import { saveSignupTime } from 'server/db/settings/settingsService';
import { logger } from 'server/utils/logger';

// Add open signup time to server settings
export const postSignupTime = async (signupTime: string): Promise<unknown> => {
  logger.info('API call: POST /api/signuptime');

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
      error,
    };
  }
};
