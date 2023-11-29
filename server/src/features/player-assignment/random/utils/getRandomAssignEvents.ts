import dayjs from "dayjs";
import { Game } from "shared/typings/models/game";
import { RandomAssignEvent } from "server/types/padgRandomAssignTypes";
import { Signup } from "server/features/signup/signupTypes";

export const getRandomAssignEvents = (
  signedGames: readonly Game[],
  signups: readonly Signup[],
): RandomAssignEvent[] => {
  return signedGames.map((signedGame) => {
    // Program item can have existing signups if program item's start time has changed
    // Consider existing signups when determining program item attendee limits
    const gameSignup = signups.find(
      (signup) => signup.game.gameId === signedGame.gameId,
    );

    const changedSignups = gameSignup?.userSignups.filter((userSignup) => {
      const startTimeChanged = !dayjs(userSignup.time).isSame(
        dayjs(signedGame.startTime),
      );
      if (startTimeChanged) {
        return true;
      }
    });

    const currentSignups = changedSignups?.length ?? 0;

    return {
      id: signedGame.gameId,
      min: signedGame.minAttendance - currentSignups,
      max: signedGame.maxAttendance - currentSignups,
      groups: [],
    };
  });
};
