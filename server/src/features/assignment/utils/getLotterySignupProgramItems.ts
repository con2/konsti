import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "server/types/userTypes";

export const getLotterySignupProgramItems = (
  startingProgramItems: readonly ProgramItem[],
  lotterySignups: readonly LotterySignup[],
): ProgramItem[] => {
  logger.debug("Get selected program items");
  const lotterySignupProgramItems: ProgramItem[] = [];
  let minAttendance = 0;
  let maxAttendance = 0;

  // Get valid program items from program items that are starting and program items that have lottery signups
  for (const startingProgramItem of startingProgramItems) {
    for (const lotterySignup of lotterySignups) {
      if (startingProgramItem.programItemId === lotterySignup.programItemId) {
        lotterySignupProgramItems.push(startingProgramItem);
        minAttendance += startingProgramItem.minAttendance;
        maxAttendance += startingProgramItem.maxAttendance;
        break;
      }
    }
  }

  logger.debug(
    `Found ${lotterySignupProgramItems.length} program items that have lottery signups and ${minAttendance}-${maxAttendance} available seats`,
  );

  return lotterySignupProgramItems;
};
