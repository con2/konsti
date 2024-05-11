import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupWish } from "server/types/userTypes";

export const getLotterySignupProgramItems = (
  startingProgramItems: readonly ProgramItem[],
  signupWishes: readonly SignupWish[],
): ProgramItem[] => {
  logger.debug("Get selected program items");
  const lotterySignupProgramItems = [] as ProgramItem[];
  let minAttendance = 0;
  let maxAttendance = 0;

  // Get valid program items from program items that are starting and program items that have lottery signups
  startingProgramItems.forEach((startingProgramItem) => {
    for (let i = 0; i < signupWishes.length; i += 1) {
      if (startingProgramItem.programItemId === signupWishes[i].programItemId) {
        lotterySignupProgramItems.push(startingProgramItem);
        minAttendance += startingProgramItem.minAttendance;
        maxAttendance += startingProgramItem.maxAttendance;
        break;
      }
    }
  });

  logger.debug(
    `Found ${lotterySignupProgramItems.length} program items that have signup wishes and ${minAttendance}-${maxAttendance} available seats`,
  );

  return lotterySignupProgramItems;
};
