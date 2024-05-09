import dayjs from "dayjs";
import { ProgramItem } from "shared/types/models/programItem";
import { RandomAssignEvent } from "server/types/padgRandomAssignTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export const getRandomAssignEvents = (
  lotterySignupGames: readonly ProgramItem[],
  directSignups: readonly DirectSignupsForProgramItem[],
): RandomAssignEvent[] => {
  return lotterySignupGames.map((selectedGame) => {
    // Program item can have existing direct signups if program item's start time has changed
    // Consider existing direct signups when determining program item attendee limits
    const gameSignup = directSignups.find(
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
