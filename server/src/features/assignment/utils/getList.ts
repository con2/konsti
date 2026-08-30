import { first } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup, User } from "shared/types/models/user";
import {
  getAssignmentBonus,
  getAssignmentBonusContext,
} from "server/features/assignment/utils/getAssignmentBonus";
import {
  getLotterySignupsInRun,
  indexProgramItemsById,
} from "server/features/assignment/utils/getLotterySignupsInRun";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ListItem } from "server/types/assignmentTypes";
import { logger } from "server/utils/logger";

interface GetListParams {
  attendeeGroups: readonly User[][];
  assignmentTime: string;
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[];
  lotterySignupProgramItems: readonly ProgramItem[];
  allProgramItems: readonly ProgramItem[];
}

export const getList = ({
  attendeeGroups,
  assignmentTime,
  lotteryParticipantDirectSignups,
  lotterySignupProgramItems,
  allProgramItems,
}: GetListParams): ListItem[] => {
  const bonusContext = getAssignmentBonusContext(
    allProgramItems,
    assignmentTime,
  );

  const programItemsById = indexProgramItemsById(lotterySignupProgramItems);

  const results = attendeeGroups.flatMap((attendeeGroup) => {
    const firstMember = first(attendeeGroup);
    if (!firstMember) {
      logger.error(new Error("Assignment getList: error getting first member"));
      return [];
    }

    const lotterySignupsInThisRun = getLotterySignupsInRun(
      firstMember.lotterySignups,
      programItemsById,
      assignmentTime,
    );
    if (lotterySignupsInThisRun.length === 0) {
      return [];
    }

    // A property of the group rather than of the preference being scored, so it is asked once
    // rather than once per preference
    const bonus = getAssignmentBonus(
      attendeeGroup,
      lotteryParticipantDirectSignups,
      bonusContext,
    );

    return lotterySignupsInThisRun.map((lotterySignup) => {
      return {
        id:
          firstMember.groupCode === "0"
            ? firstMember.serial
            : firstMember.groupCode,
        size: attendeeGroup.length,
        event: lotterySignup.programItemId,
        gain: getGain(lotterySignup, bonus),
      };
    });
  });

  return results;
};

const getGain = (lotterySignup: LotterySignup, bonus: number): number => {
  switch (lotterySignup.priority) {
    case 1:
      return 1 + bonus;
    case 2:
      return 0.5 + bonus;
    case 3:
      return 0.33 + bonus;
    default:
      // Invalid priority
      return 0;
  }
};
