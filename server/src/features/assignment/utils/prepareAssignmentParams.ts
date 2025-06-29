import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";

const getValidLotterySignupsUsers = (
  users: User[],
  programItems: ProgramItem[],
): User[] => {
  return users.map((user) => {
    const matchingLotterySignups = user.lotterySignups.filter(
      (lotterySignup) => {
        const foundProgramItem = programItems.find(
          (programItem) =>
            programItem.programItemId === lotterySignup.programItemId,
        );
        if (!foundProgramItem) {
          return false;
        }
        return isLotterySignupProgramItem(foundProgramItem);
      },
    );

    return { ...user, lotterySignups: matchingLotterySignups };
  });
};

// "Lottery participant" means program item took part in lottery and direct signup is either from lottery or after lottery
export const getLotteryParticipantDirectSignups = (
  directSignups: readonly DirectSignupsForProgramItem[],
  programItems: readonly ProgramItem[],
): readonly DirectSignupsForProgramItem[] => {
  // Take program items with "twoPhaseSignupProgramTypes" which are not in "directSignupAlwaysOpenIds"
  const lotteryValidProgramItemsIds = new Set(
    programItems
      .filter((programItem) => isLotterySignupProgramItem(programItem))
      .map((programItem) => programItem.programItemId),
  );

  const lotteryParticipantDirectSignups = directSignups.filter(
    (directSignup) => {
      return lotteryValidProgramItemsIds.has(directSignup.programItemId);
    },
  );

  return lotteryParticipantDirectSignups;
};

interface AssignmentParams {
  validLotterySignupsUsers: User[];
  validLotterySignupProgramItems: ProgramItem[];
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[];
}

export const prepareAssignmentParams = (
  users: User[],
  programItems: ProgramItem[],
  directSignups: DirectSignupsForProgramItem[],
): AssignmentParams => {
  // Remove invalid lottery signups from users
  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  const validLotterySignupsUsers = getValidLotterySignupsUsers(
    users,
    programItems,
  );

  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  const validLotterySignupProgramItems = programItems.filter((programItem) =>
    isLotterySignupProgramItem(programItem),
  );

  // Take program items with "twoPhaseSignupProgramTypes" which are not in "directSignupAlwaysOpenIds"
  const lotteryParticipantDirectSignups = getLotteryParticipantDirectSignups(
    directSignups,
    programItems,
  );

  return {
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    lotteryParticipantDirectSignups,
  };
};
