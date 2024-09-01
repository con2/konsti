import { logger } from "server/utils/logger";
import { updateWithAssign } from "server/features/program-item-popularity/utils/updateWithAssign";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
import { config } from "shared/config";

export const updateProgramItemPopularity = async (): Promise<
  Result<void, MongoDbError | AssignmentError>
> => {
  const { twoPhaseSignupProgramTypes } = config.event();

  logger.info(`Calculate program item popularity`);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult).filter((programItem) =>
    twoPhaseSignupProgramTypes.includes(programItem.programType),
  );

  const directSignupsResult = await findDirectSignups();
  if (isErrorResult(directSignupsResult)) {
    return directSignupsResult;
  }
  const directSignups = unwrapResult(directSignupsResult);

  const updateWithAssignResult = await updateWithAssign(
    users,
    programItems,
    directSignups,
  );
  if (isErrorResult(updateWithAssignResult)) {
    return updateWithAssignResult;
  }

  logger.info("Program item popularity updated");

  return makeSuccessResult(undefined);
};
