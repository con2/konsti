import { first } from "remeda";
import dayjs from "dayjs";
import { ListItem } from "server/types/assignmentTypes";
import { getAssignmentBonus } from "server/features/assignment/utils/getAssignmentBonus";
import { LotterySignup, User } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";

interface GetListParams {
  attendeeGroups: readonly User[][];
  assignmentTime: string;
  lotteryValidDirectSignups: readonly DirectSignupsForProgramItem[];
  lotterySignupProgramItems: readonly ProgramItem[];
}

export const getList = ({
  attendeeGroups,
  assignmentTime,
  lotteryValidDirectSignups,
  lotterySignupProgramItems,
}: GetListParams): ListItem[] => {
  const results = attendeeGroups.flatMap((attendeeGroup) => {
    const firstMember = first(attendeeGroup);
    if (!firstMember) {
      logger.error(
        "%s",
        new Error("Padg or Random assign: error getting first member"),
      );
      return [];
    }

    const list = firstMember.lotterySignups
      .filter(
        (lotterySignup) =>
          dayjs(lotterySignup.signedToStartTime).toISOString() ===
          dayjs(assignmentTime).toISOString(),
      )
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
            lotteryValidDirectSignups,
            lotterySignupProgramItems,
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
  lotteryValidDirectSignups: readonly DirectSignupsForProgramItem[],
  lotterySignupProgramItems: readonly ProgramItem[],
): number => {
  const bonus = getAssignmentBonus(
    attendeeGroup,
    lotteryValidDirectSignups,
    lotterySignupProgramItems,
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
