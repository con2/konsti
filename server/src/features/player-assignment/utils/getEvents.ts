import dayjs from "dayjs";
import { Game } from "shared/typings/models/game";
import { Event } from "server/typings/padgRandomAssignTypes";
import { Signup } from "server/features/signup/signupTypes";

// TODO: Merge this with getRandomAssignEvents
export const getEvents = (
  signedGames: readonly Game[],
  signups: readonly Signup[],
): Event[] => {
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
