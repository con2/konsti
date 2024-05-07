import dayjs from "dayjs";
import { Game } from "shared/types/models/game";
import { Event } from "server/types/padgRandomAssignTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

// TODO: Merge this with getRandomAssignEvents
export const getEvents = (
  selectedGames: readonly Game[],
  signups: readonly DirectSignupsForProgramItem[],
): Event[] => {
  return selectedGames.map((selectedGame) => {
    // Program item can have existing signups if program item's start time has changed
    // Consider existing signups when determining program item attendee limits
    const gameSignup = signups.find(
      (signup) => signup.game.gameId === selectedGame.gameId,
    );

    const changedSignups = gameSignup?.userSignups.filter((userSignup) => {
      const startTimeChanged = !dayjs(userSignup.time).isSame(
        dayjs(selectedGame.startTime),
      );
      if (startTimeChanged) {
        return true;
      }
    });

    const currentSignups = changedSignups?.length ?? 0;

    return {
      id: selectedGame.gameId,
      min: selectedGame.minAttendance - currentSignups,
      max: selectedGame.maxAttendance - currentSignups,
      groups: [],
    };
  });
};
