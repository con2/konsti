import { Result } from "shared/typings/models/result";
import {
  delSignup,
  delSignupsByStartTime,
  findRpgSignupsByStartTime,
  FindSignupsByStartTimeResponse,
  saveSignup,
} from "server/features/signup/signupRepository";
import { logger } from "server/utils/logger";

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly Result[]
): Promise<void> => {
  await delSignupsByStartTime(startingTime);

  let signups: FindSignupsByStartTimeResponse[];
  try {
    signups = await findRpgSignupsByStartTime(startingTime);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  // If user has previous directSignupAlwaysOpen signups...
  // ... and no new result -> don't remove
  // ... and new result -> remove
  const deletePromises = results.map(async (result) => {
    const existingSignup = signups.find(
      (signup) => signup.username === result.username
    );

    if (existingSignup) {
      await delSignup({
        username: existingSignup.username,
        enteredGameId: existingSignup.gameId,
        startTime: existingSignup.time,
      });
    }
  });

  try {
    await Promise.all(deletePromises);
  } catch (error) {
    throw new Error(`Error removing signup results for users: ${error}`);
  }

  const savePromises = results.map(async (result) => {
    return await saveSignup({
      username: result.username,
      enteredGameId: result.enteredGame.gameDetails.gameId,
      startTime: startingTime,
      message: result.enteredGame.message,
    });
  });

  try {
    await Promise.all(savePromises);
  } catch (error) {
    throw new Error(`Error saving signup results for users: ${error}`);
  }
};
