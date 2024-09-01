import dayjs from "dayjs";
import { countBy, groupBy } from "lodash-es";
import { padgAssignment } from "server/features/assignment/padg/padgAssignment";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import { saveProgramItemPopularity } from "server/features/program-item/programItemRepository";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  isSuccessResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";

export const updateWithAssign = async (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  directSignups: readonly DirectSignupsForProgramItem[],
): Promise<Result<void, MongoDbError | AssignmentError>> => {
  const programItemsForStartTimes = groupBy(programItems, (programItem) =>
    dayjs(programItem.startTime).toISOString(),
  );

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return timeNowResult;
  }
  const timeNow = unwrapResult(timeNowResult);

  const futureStartTimes = Object.keys(programItemsForStartTimes).filter(
    (startTime) => dayjs(startTime).isSameOrAfter(timeNow),
  );

  const assignmentResultsResult = futureStartTimes.map((startTime) => {
    // TODO: Use runAssignmentAlgorithm() instead to run with all selected algorithms?
    return padgAssignment(users, programItems, startTime, directSignups);
  });

  const someAssignmentFailed = assignmentResultsResult.some(
    (assignmentResult) => isErrorResult(assignmentResult),
  );
  if (someAssignmentFailed) {
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  const results = assignmentResultsResult.flatMap((result) => {
    if (isSuccessResult(result)) {
      return unwrapResult(result).results;
    }
    return [];
  });

  const directSignupsResult = results.flatMap(
    (result) => result.directSignup.programItem,
  );

  const groupedSignups = countBy(directSignupsResult, "programItemId");

  const programItemPopularityUpdates = programItems
    .map((programItem) => ({
      programItemId: programItem.programItemId,
      popularity: groupedSignups[programItem.programItemId],
    }))
    .filter((popularityUpdate) => popularityUpdate.popularity);

  const saveProgramItemPopularityResult = await saveProgramItemPopularity(
    programItemPopularityUpdates,
  );

  if (isErrorResult(saveProgramItemPopularityResult)) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
