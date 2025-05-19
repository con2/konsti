import { first } from "remeda";
import { PadgRandomAssignResult } from "server/types/assignmentTypes";
import { logger } from "server/utils/logger";
import {
  AssignmentSignup,
  UserAssignmentResult,
} from "shared/types/models/result";
import { User } from "shared/types/models/user";

const getAssignmentSignup = (
  assignResults: PadgRandomAssignResult[],
  attendee: User,
): AssignmentSignup | null => {
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
      const assignmentSignup = getAssignmentSignup(assignResults, attendee);
      if (assignmentSignup) {
        acc.push({
          username: attendee.username,
          assignmentSignup,
        });
      }
      return acc;
    },
    [],
  );

  return results;
};
