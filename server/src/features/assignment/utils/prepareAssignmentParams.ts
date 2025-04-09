import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";

const getValidLotterySignupsUsers = (users: User[]): User[] => {
  return users.map((user) => {
    const matchingLotterySignups = user.lotterySignups.filter((lotterySignup) =>
      isLotterySignupProgramItem(lotterySignup.programItem),
    );

    return { ...user, lotterySignups: matchingLotterySignups };
  });
};

export const getLotteryValidDirectSignups = (
  directSignups: readonly DirectSignupsForProgramItem[],
  programItems: readonly ProgramItem[],
): readonly DirectSignupsForProgramItem[] => {
  // Take program items with "twoPhaseSignupProgramTypes" which are not in "directSignupAlwaysOpenIds"
  const lotteryValidProgramItemsIds = new Set(
    programItems
      .filter((programItem) => isLotterySignupProgramItem(programItem))
      .map((programItem) => programItem.programItemId),
  );

  const lotteryValidDirectSignups = directSignups.filter((directSignup) => {
    return lotteryValidProgramItemsIds.has(directSignup.programItemId);
  });

  return lotteryValidDirectSignups;
};

interface AssignmentParams {
  validLotterySignupsUsers: User[];
  validLotterySignupProgramItems: ProgramItem[];
  lotteryValidDirectSignups: readonly DirectSignupsForProgramItem[];
}

export const prepareAssignmentParams = (
  users: User[],
  programItems: ProgramItem[],
  directSignups: DirectSignupsForProgramItem[],
): AssignmentParams => {
  // Remove invalid lottery signups from users
  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  const validLotterySignupsUsers = getValidLotterySignupsUsers(users);

  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  const validLotterySignupProgramItems = programItems.filter((programItem) =>
    isLotterySignupProgramItem(programItem),
  );

  // Take program items with "twoPhaseSignupProgramTypes" which are not in "directSignupAlwaysOpenIds"
  const lotteryValidDirectSignups = getLotteryValidDirectSignups(
    directSignups,
    programItems,
  );

  return {
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    lotteryValidDirectSignups,
  };
};
