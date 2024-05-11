import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";

export const getSelectedAttendees = (
  attendees: readonly User[],
  startingProgramItems: readonly ProgramItem[],
): User[] => {
  logger.debug("Get selected attendees");

  // Get users who have lottery signups for starting program items
  const selectedAttendees = [] as User[];

  attendees.forEach((attendee) => {
    let match = false;
    for (let i = 0; i < attendee.lotterySignups.length; i += 1) {
      for (let j = 0; j < startingProgramItems.length; j += 1) {
        if (
          attendee.lotterySignups[i].programItem.programItemId ===
          startingProgramItems[j].programItemId
        ) {
          match = true;
          break;
        }
      }
      // Attendee matched, break
      if (match) {
        selectedAttendees.push(attendee);
        break;
      }
    }
  });

  logger.debug(
    `Found ${selectedAttendees.length} attendees for this start time`,
  );

  return selectedAttendees;
};
