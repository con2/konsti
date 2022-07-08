import { Result } from "shared/typings/models/result";
import {
  delSignupsByStartTime,
  saveSignup,
} from "server/features/signup/signupRepository";

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly Result[]
): Promise<void> => {
  await delSignupsByStartTime(startingTime);

  const promises = results.map(async (result) => {
    return await saveSignup({
      username: result.username,
      enteredGameId: result.enteredGame.gameDetails.gameId,
      startTime: startingTime,
      message: result.enteredGame.message,
    });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    throw new Error(`Error saving signup results for users: ${error}`);
  }
};
