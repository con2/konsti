import dayjs, { Dayjs } from "dayjs";
import { sharedConfig } from "shared/config/sharedConfig";
import { Game, ProgramType } from "shared/typings/models/game";
import { getPhaseGap } from "shared/utils/getPhaseGap";

export const getDirectSignupStartTime = (
  game: Game,
  timeNow: Dayjs
): string | null => {
  const { directSignupWindows } = sharedConfig;

  const signupWindowsForProgramType = directSignupWindows[game.programType];

  const matchingSignupWindow = signupWindowsForProgramType.find(
    (signupWindow) =>
      dayjs(game.startTime).isBetween(
        signupWindow.signupWindowStart,
        signupWindow.signupWindowClose,
        "minutes",
        "[]"
      )
  );

  if (matchingSignupWindow?.signupWindowStart.isAfter(timeNow)) {
    return dayjs(matchingSignupWindow.signupWindowStart).format();
  }

  if (game.programType === ProgramType.TABLETOP_RPG) {
    const phaseGap = getPhaseGap({
      startTime: dayjs(game.startTime),
      timeNow,
    });

    if (phaseGap.waitingForPhaseGapToEnd) {
      return phaseGap.phaseGapEndTime;
    }
  }

  return null;
};
