import { first } from "remeda";
import { PadgRandomAssignResult } from "server/types/assignmentTypes";
import { logger } from "server/utils/logger";
import { UserAssignmentResult } from "shared/types/models/result";
import { DirectSignup, User } from "shared/types/models/user";

const getDirectSignup = (
  assignResults: PadgRandomAssignResult[],
  attendee: User,
): DirectSignup | null => {
  const foundSignup = attendee.lotterySignups.find((lotterySignup) => {
    return assignResults.find(
      (assignResult) =>
        (assignResult.id === attendee.groupCode ||
          assignResult.id === attendee.serial) &&
        assignResult.assignment === lotterySignup.programItemId,
    );
  });

  if (!foundSignup) {
    return null;
  }

  return {
    programItemId: foundSignup.programItemId,
    priority: foundSignup.priority,
    signedToStartTime: foundSignup.signedToStartTime,
    // Direct signups received from lottery don't have signup messages
    message: "",
  };
};

export const formatResults = (
  assignResults: PadgRandomAssignResult[],
  attendeeGroups: readonly User[][],
): readonly UserAssignmentResult[] => {
  const selectedAttendees = attendeeGroups
    .filter((attendeeGroup) => {
      const firstMember = first(attendeeGroup);

      if (!firstMember) {
        logger.error(
          "%s",
          new Error("Assignment formatResults: error getting first member"),
        );
        return false;
      }

      return assignResults.find(
        (assignResult) =>
          (assignResult.id === firstMember.groupCode ||
            assignResult.id === firstMember.serial) &&
          assignResult.assignment !== -1,
      );
    })
    .flat();

  const results = selectedAttendees.reduce<UserAssignmentResult[]>(
    (acc, attendee) => {
      const directSignup = getDirectSignup(assignResults, attendee);
      if (directSignup) {
        acc.push({
          username: attendee.username,
          directSignup,
        });
      }
      return acc;
    },
    [],
  );

  return results;
};
