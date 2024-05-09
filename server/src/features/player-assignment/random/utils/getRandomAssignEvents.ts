import dayjs from "dayjs";
import { ProgramItem } from "shared/types/models/programItem";
import { RandomAssignEvent } from "server/types/padgRandomAssignTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export const getRandomAssignEvents = (
  lotterySignupProgramItems: readonly ProgramItem[],
  directSignups: readonly DirectSignupsForProgramItem[],
): RandomAssignEvent[] => {
  return lotterySignupProgramItems.map((selectedGame) => {
    // Program item can have existing direct signups if program item's start time has changed
    // Consider existing direct signups when determining program item attendee limits
    const programItemSignup = directSignups.find(
      (signup) =>
        signup.programItem.programItemId === selectedGame.programItemId,
    );

    const changedSignups = programItemSignup?.userSignups.filter(
      (userSignup) => {
        const startTimeChanged = !dayjs(userSignup.time).isSame(
          dayjs(selectedGame.startTime),
        );
        if (startTimeChanged) {
          return true;
        }
      },
    );

    const currentSignups = changedSignups?.length ?? 0;

    return {
      id: selectedGame.programItemId,
      min: selectedGame.minAttendance - currentSignups,
      max: selectedGame.maxAttendance - currentSignups,
      groups: [],
    };
  });
};
