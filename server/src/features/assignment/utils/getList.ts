import { first } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup, User } from "shared/types/models/user";
import { isSameStartTime } from "shared/utils/signupTimes";
import { getAssignmentBonus } from "server/features/assignment/utils/getAssignmentBonus";
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
  const results = attendeeGroups.flatMap((attendeeGroup) => {
    const firstMember = first(attendeeGroup);
    if (!firstMember) {
      logger.error(new Error("Assignment getList: error getting first member"));
      return [];
    }

    const list = firstMember.lotterySignups
      .filter((lotterySignup) => {
        const programItem = lotterySignupProgramItems.find(
          (lotterySignupProgramItem) =>
            lotterySignupProgramItem.programItemId ===
            lotterySignup.programItemId,
        );
        // A sign-up naming a program item this run is not allocating has no event to map
        // to, and the assigner rejects the whole input over a single such preference
        if (!programItem) {
          return false;
        }
        return isSameStartTime(
          programItem.startTime,
          programItem.parentId,
          assignmentTime,
        );
      })
      .map((lotterySignup) => {
        return {
          id:
            firstMember.groupCode === "0"
              ? firstMember.serial
              : firstMember.groupCode,
          size: attendeeGroup.length,
          event: lotterySignup.programItemId,
          gain: getGain(
            lotterySignup,
            attendeeGroup,
            lotteryParticipantDirectSignups,
            lotterySignupProgramItems,
            allProgramItems,
            assignmentTime,
          ),
        };
      });

    return list;
  });

  return results;
};

const getGain = (
  lotterySignup: LotterySignup,
  attendeeGroup: User[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
  lotterySignupProgramItems: readonly ProgramItem[],
  allProgramItems: readonly ProgramItem[],
  assignmentTime: string,
): number => {
  const bonus = getAssignmentBonus(
    attendeeGroup,
    lotteryParticipantDirectSignups,
    lotterySignupProgramItems,
    allProgramItems,
    assignmentTime,
  );

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
