import { partition } from "remeda";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { logger } from "server/utils/logger";

interface PartitionByHeldSignupsReturn {
  emptyProgramItems: ProgramItem[];
  occupiedProgramItems: ProgramItem[];
}

// A lottery program item is empty when its lottery runs. One that isn't keeps what it has and
// stays on direct sign-up, since lotterying the rest would decide a single program item by two
// different rules. The caller marks the occupied ones, so emptying one cannot put it back.
export const partitionByHeldSignups = (
  notYetLotteriedProgramItems: readonly ProgramItem[],
  directSignups: readonly DirectSignupsForProgramItem[],
  assignmentTime: string,
): PartitionByHeldSignupsReturn => {
  const userSignupsByProgramItemId = new Map(
    directSignups.map((directSignup) => [
      directSignup.programItemId,
      directSignup.userSignups,
    ]),
  );

  const [occupiedProgramItems, emptyProgramItems] = partition(
    notYetLotteriedProgramItems,
    (programItem) =>
      (userSignupsByProgramItemId.get(programItem.programItemId) ?? []).length >
      0,
  );

  // Reported apart only to say which way it broke: a lottery priority means an earlier run
  // placed people here and stopped before marking it, a first-come one means the program item
  // is taking direct sign-ups by another route
  const [lotteryPlaced, takingDirectSignups] = partition(
    occupiedProgramItems,
    (programItem) =>
      (userSignupsByProgramItemId.get(programItem.programItemId) ?? []).some(
        (userSignup) => userSignup.priority !== DIRECT_SIGNUP_PRIORITY,
      ),
  );

  if (lotteryPlaced.length > 0) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: ${lotteryPlaced.length} program items already hold lottery-placed sign-ups, so an earlier run placed attendees there without marking it: ${lotteryPlaced.map((programItem) => programItem.programItemId).join(", ")}`,
      ),
    );
  }

  if (takingDirectSignups.length > 0) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: ${takingDirectSignups.length} program items already hold first-come-first-served sign-ups, leaving them on direct sign-up instead of lotterying them: ${takingDirectSignups.map((programItem) => programItem.programItemId).join(", ")}`,
      ),
    );
  }

  return { emptyProgramItems, occupiedProgramItems };
};
