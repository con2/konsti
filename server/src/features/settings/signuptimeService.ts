import { saveSignupTime } from 'server/features/settings/settingsRepository';

export const storeSignupTime = async (signupTime: string): Promise<unknown> => {
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
