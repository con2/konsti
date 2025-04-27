import { first } from "lodash-es";
import { PadgRandomAssignResult } from "server/types/assignmentTypes";
import { logger } from "server/utils/logger";
import { AssignmentError } from "shared/types/api/errors";
import { UserAssignmentResult } from "shared/types/models/result";
import { DirectSignup, User } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";

export const formatResults = (
  assignResults: PadgRandomAssignResult[],
  attendeeGroups: readonly User[][],
): Result<readonly UserAssignmentResult[], AssignmentError> => {
  const selectedAttendees = attendeeGroups
    .filter((attendeeGroup) => {
      const firstMember = first(attendeeGroup);

      if (!firstMember) {
        logger.error(
          "%s",
          new Error("Padg assign: error getting first member"),
        );
        return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
      }

      return assignResults.find(
        (assignResult) =>
          (assignResult.id === firstMember.groupCode ||
            assignResult.id === firstMember.serial) &&
          assignResult.assignment !== -1,
      );
    })
    .flat();

  const getDirectSignup = (attendee: User): DirectSignup | undefined => {
    const foundSignup = attendee.lotterySignups.find((lotterySignup) => {
      return assignResults.find(
        (assignResult) =>
          (assignResult.id === attendee.groupCode ||
            assignResult.id === attendee.serial) &&
          assignResult.assignment === lotterySignup.programItemId,
      );
    });

    if (!foundSignup) {
      return undefined;
    }

    return {
      programItemId: foundSignup.programItemId,
      priority: foundSignup.priority,
      time: foundSignup.time,
      message: foundSignup.message,
    };
  };

  const results = selectedAttendees.reduce<UserAssignmentResult[]>(
    (acc, attendee) => {
      const directSignup = getDirectSignup(attendee);
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

  return makeSuccessResult(results);
};
