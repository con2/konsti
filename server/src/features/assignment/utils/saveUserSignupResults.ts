import dayjs from "dayjs";
import { unique } from "remeda";
import { UserAssignmentResult } from "shared/types/models/result";
import {
  delDirectSignup,
  delAssignmentDirectSignupsByStartTime,
  findDirectSignupsByStartTime,
  saveDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/types/models/eventLog";
import { getLotterySignups } from "server/features/assignment/utils/getLotterySignups";
import { User } from "shared/types/models/user";
import { getGroupCreators } from "server/features/assignment/utils/getGroupCreators";
import { getGroupMembersWithCreatorLotterySignups } from "server/features/assignment/utils/getGroupMembers";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";

interface SaveUserSignupResultsParams {
  assignmentTime: string;
  results: readonly UserAssignmentResult[];
  users: User[];
  programItems: ProgramItem[];
}

export const saveUserSignupResults = async ({
  assignmentTime,
  results,
  users,
  programItems,
}: SaveUserSignupResultsParams): Promise<Result<void, MongoDbError>> => {
  // Remove previous lottery result for the same start time
  // This does not remove non-lottery signups or previous signups from moved program items
  const delAssignmentSignupsByStartTimeResult =
    await delAssignmentDirectSignupsByStartTime(assignmentTime, programItems);
  if (isErrorResult(delAssignmentSignupsByStartTimeResult)) {
    return delAssignmentSignupsByStartTimeResult;
  }

  // Only non-lottery signups and previous signups from moved program items should be remaining
  const directSignupsByStartTimeResult = await findDirectSignupsByStartTime(
    assignmentTime,
    programItems,
  );
  if (isErrorResult(directSignupsByStartTimeResult)) {
    return directSignupsByStartTimeResult;
  }
  const directSignupsByStartTime = unwrapResult(directSignupsByStartTimeResult);

  // Resolve conflicting existing direct signups
  // If user has existing signups...
  // ... and new assignment result -> remove existing
  // ... and no new assignment result -> keep existing
  const deletePromises = results.map(async (result) => {
    const existingSignup = directSignupsByStartTime.find(
      (signup) => signup.username === result.username,
    );

    if (existingSignup) {
      const delSignupResult = await delDirectSignup({
        username: existingSignup.username,
        directSignupProgramItemId: existingSignup.programItemId,
      });
      if (isErrorResult(delSignupResult)) {
        return delSignupResult;
      }
    }
    return makeSuccessResult();
  });

  const deleteResults = await Promise.all(deletePromises);
  const someDeleteFailed = deleteResults.some((deleteResult) =>
    isErrorResult(deleteResult),
  );
  if (someDeleteFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  // Save new assignment results
  const newSignups: SignupRepositoryAddSignup[] = results.map((result) => {
    return {
      username: result.username,
      directSignupProgramItemId: result.assignmentSignup.programItemId,
      signedToStartTime: assignmentTime,
      // Signups received from assignment don't have signup messages
      message: "",
      priority: result.assignmentSignup.priority,
    };
  });

  // This might drop some signups if by some error too many signups are passed for a program item
  const saveSignupsResult = await saveDirectSignups(newSignups, programItems);
  if (isErrorResult(saveSignupsResult)) {
    return saveSignupsResult;
  }
  const { droppedSignups } = unwrapResult(saveSignupsResult);

  // Remove eventLog items from same start time
  const deleteEventLogItemsByStartTimeResult =
    await deleteEventLogItemsByStartTime(assignmentTime, [
      EventLogAction.NEW_ASSIGNMENT,
      EventLogAction.NO_ASSIGNMENT,
    ]);
  if (isErrorResult(deleteEventLogItemsByStartTimeResult)) {
    return deleteEventLogItemsByStartTimeResult;
  }

  // Filter out possible dropped results
  const finalResults =
    droppedSignups.length > 0
      ? results.filter((result) => {
          return droppedSignups.find(
            (signup) =>
              !(
                signup.directSignupProgramItemId ===
                  result.assignmentSignup.programItemId &&
                signup.username === result.username
              ),
          );
        })
      : results;

  // Add NEW_ASSIGNMENT to user event logs
  const newAssignmentEventLogItemsResult = await addEventLogItems({
    updates: finalResults.map((result) => ({
      username: result.username,
      programItemId: result.assignmentSignup.programItemId,
      programItemStartTime: assignmentTime,
      createdAt: dayjs().toISOString(),
    })),
    action: EventLogAction.NEW_ASSIGNMENT,
  });
  if (isErrorResult(newAssignmentEventLogItemsResult)) {
    return newAssignmentEventLogItemsResult;
  }

  // Get users who didn't get a seat in lottery
  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  );
  const groupCreators = getGroupCreators(users, startingProgramItems);
  const groupMembers = getGroupMembersWithCreatorLotterySignups(
    groupCreators,
    users,
  );
  const allAttendees = [...groupCreators, ...groupMembers];
  const lotterySignups = getLotterySignups(allAttendees);

  const lotterySignupsForStartingTime = lotterySignups.filter((lotterySignup) =>
    dayjs(lotterySignup.signedToStartTime).isSame(dayjs(assignmentTime)),
  );

  const lotterySignupUsernames = unique(
    lotterySignupsForStartingTime.map(
      (lotterySignup) => lotterySignup.username,
    ),
  );

  const noAssignmentLotterySignupUsernames = lotterySignupUsernames.flatMap(
    (lotterySignupUsername) => {
      const userWithLotterySignup = results.find(
        (result) => result.username === lotterySignupUsername,
      );
      if (!userWithLotterySignup) {
        return lotterySignupUsername;
      }
      return [];
    },
  );

  // Add NO_ASSIGNMENT to user event logs
  if (noAssignmentLotterySignupUsernames.length > 0) {
    const noAssignmentEventLogItemsResult = await addEventLogItems({
      updates: noAssignmentLotterySignupUsernames.map(
        (noAssignmentLotterySignupUsername) => ({
          username: noAssignmentLotterySignupUsername,
          programItemId: "",
          programItemStartTime: assignmentTime,
          createdAt: dayjs().toISOString(),
        }),
      ),
      action: EventLogAction.NO_ASSIGNMENT,
    });
    if (isErrorResult(noAssignmentEventLogItemsResult)) {
      return noAssignmentEventLogItemsResult;
    }
  }

  return makeSuccessResult();
};
