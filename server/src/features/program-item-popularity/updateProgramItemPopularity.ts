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

  const signupsResult = await findDirectSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }
  const signups = unwrapResult(signupsResult);

  const updateWithAssignResult = await updateWithAssign(
    users,
    programItems,
    signups,
  );
  if (isErrorResult(updateWithAssignResult)) {
    return updateWithAssignResult;
  }

  logger.info("Program item popularity updated");

  return makeSuccessResult(undefined);
};
