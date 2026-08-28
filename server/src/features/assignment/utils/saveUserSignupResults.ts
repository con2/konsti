import { isSameMinute } from "date-fns";
import { countBy, groupBy, unique } from "remeda";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { User } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import {
  delDirectSignups,
  findDirectSignupsByStartTimes,
  saveDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { logger } from "server/utils/logger";

interface SaveUserSignupResultsParams {
  assignmentTime: string;
  results: readonly UserAssignmentResult[];
  users: User[];
  programItems: ProgramItem[];
}

// The one write in a lottery run that anybody depends on: everything after it is bookkeeping
// and messages. Its bulk write either lands or it doesn't, so a run that fails before this
// point placed nobody and can be run again
export const saveUserSignupResults = async ({
  assignmentTime,
  results,
  users,
  programItems,
  // Returns the results that actually landed: saveDirectSignups can drop a sign-up that no
  // longer fits, and the caller must not record those attendees as placed
}: SaveUserSignupResultsParams): Promise<
  Result<readonly UserAssignmentResult[], MongoDbError>
> => {
  // The hours the lottery placed people at, which for a batched program item are not the hour
  // its lottery ran: a won spot only displaces what the attendee holds at that same hour
  const wonStartTimes = unique(
    results.map((result) => result.assignmentSignup.signedToStartTime),
  );

  const directSignupsByStartTimeResult = await findDirectSignupsByStartTimes(
    wonStartTimes,
    programItems,
  );
  if (!directSignupsByStartTimeResult.ok) {
    return directSignupsByStartTimeResult;
  }

  const groupCodeByUsername = new Map(
    users.map((user) => [user.username, user.groupCode]),
  );

  const resultsToSave = dropResultsThatDoNotFit({
    results,
    assignmentTime,
    existingSignups: directSignupsByStartTimeResult.value,
    programItems,
    groupCodeByUsername,
  });

  // A winner's own sign-ups for the hour they won give way to that spot - they can't attend
  // both. Several are possible at one hour (an always-open program item plus a moved-in one),
  // so remove every one of theirs rather than just the first. Compared against where each
  // program item starts now, since a sign-up's stored time is not rewritten when one moves
  const startTimeByProgramItemId = new Map(
    programItems.map((programItem) => [
      programItem.programItemId,
      programItem.startTime,
    ]),
  );

  const signupsToDelete = resultsToSave.flatMap((result) =>
    directSignupsByStartTimeResult.value
      .filter((signup) => {
        const heldStartTime = startTimeByProgramItemId.get(
          signup.programItemId,
        );
        return (
          signup.username === result.username &&
          heldStartTime !== undefined &&
          isSameMinute(
            new Date(heldStartTime),
            new Date(result.assignmentSignup.signedToStartTime),
          )
        );
      })
      .map((signup) => ({
        username: signup.username,
        directSignupProgramItemId: signup.programItemId,
      })),
  );

  const delDirectSignupsResult = await delDirectSignups(signupsToDelete);
  if (!delDirectSignupsResult.ok) {
    return delDirectSignupsResult;
  }

  // Save new assignment results
  const newSignups: SignupRepositoryAddSignup[] = resultsToSave.map(
    (result) => {
      return {
        username: result.username,
        directSignupProgramItemId: result.assignmentSignup.programItemId,
        // The hour of the slot they won, which for a batched program item is not the hour its
        // lottery ran: a spot belongs to when the attendee turns up
        signedToStartTime: result.assignmentSignup.signedToStartTime,
        signupTime: new Date().toISOString(),
        // Sign-ups received from assignment don't have sign-up messages
        message: "",
        priority: result.assignmentSignup.priority,
      };
    },
  );

  // This might drop some sign-ups if by some error too many sign-ups are passed for a program item
  const saveSignupsResult = await saveDirectSignups(newSignups, programItems);
  if (!saveSignupsResult.ok) {
    return saveSignupsResult;
  }
  const { droppedSignups } = saveSignupsResult.value;

  // Filter out possible dropped results
  const finalResults = resultsToSave.filter((result) => {
    return droppedSignups.every(
      (signup) =>
        signup.directSignupProgramItemId !==
          result.assignmentSignup.programItemId ||
        signup.username !== result.username,
    );
  });

  return makeSuccessResult(finalResults);
};

interface DropResultsThatDoNotFitParams {
  results: readonly UserAssignmentResult[];
  assignmentTime: string;
  existingSignups: readonly { username: string; programItemId: string }[];
  programItems: readonly ProgramItem[];
  groupCodeByUsername: ReadonlyMap<string, string>;
}

// The algorithm already respects the attendance limits, so this should never drop anything - it
// guards against the sign-ups moving under the run. Runs before any deletion, so a sign-up is
// never removed to make room for a replacement that then doesn't land, and drops a whole group
// at a time because a group lands in one program item or none
const dropResultsThatDoNotFit = ({
  results,
  assignmentTime,
  existingSignups,
  programItems,
  groupCodeByUsername,
}: DropResultsThatDoNotFitParams): readonly UserAssignmentResult[] => {
  const winners = new Set(results.map((result) => result.username));

  // A winner's existing sign-ups for this start time are deleted to make room for the spot
  // they won, so only the attendees staying put take up space
  const stayingPutByProgramItemId = countBy(
    existingSignups.filter((signup) => !winners.has(signup.username)),
    (signup) => signup.programItemId,
  );
  const remainingByProgramItemId = new Map(
    programItems.map((programItem) => [
      programItem.programItemId,
      Math.max(
        programItem.maxAttendance -
          (stayingPutByProgramItemId[programItem.programItemId] ?? 0),
        0,
      ),
    ]),
  );

  // A group is placed as a whole or not at all, so it has to fit as a whole
  const resultsByGroup = groupBy(results, (result) => {
    const groupCode = groupCodeByUsername.get(result.username);
    return groupCode === undefined || groupCode === "0"
      ? `individual-${result.username}`
      : `group-${groupCode}`;
  });

  return Object.values(resultsByGroup).flatMap((groupResults) => {
    const neededByProgramItemId = countBy(
      groupResults,
      (result) => result.assignmentSignup.programItemId,
    );

    const fits = Object.entries(neededByProgramItemId).every(
      ([programItemId, needed]) =>
        (remainingByProgramItemId.get(programItemId) ?? 0) >= needed,
    );
    if (!fits) {
      logger.error(
        new Error(
          `Assignment ${assignmentTime}: dropping ${groupResults.length} result(s) that no longer fit, leaving the attendees' existing sign-ups in place: ${groupResults.map((result) => result.username).join(", ")}`,
        ),
      );
      return [];
    }

    for (const [programItemId, needed] of Object.entries(
      neededByProgramItemId,
    )) {
      remainingByProgramItemId.set(
        programItemId,
        (remainingByProgramItemId.get(programItemId) ?? 0) - needed,
      );
    }
    return groupResults;
  });
};
