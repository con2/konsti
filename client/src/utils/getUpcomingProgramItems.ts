import { addHours, isAfter } from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import {
  getDirectSignupEndTime,
  getProgramItemStartTime,
} from "shared/utils/signupTimes";
import { isSameOrAfter } from "shared/utils/timeComparison";
import { GroupMemberWithLotteryProgramItem } from "client/views/group/groupSlice";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";

export const getUpcomingProgramItems = (
  programItems: readonly ProgramItem[],
  timeNow: Date,
): readonly ProgramItem[] => {
  const upcomingProgramItems = programItems.filter((programItem) => {
    const directSignupEndTime = getDirectSignupEndTime(programItem);
    return isSameOrAfter(directSignupEndTime, timeNow);
  });

  return upcomingProgramItems;
};

// Before this time only pre-convention week program is shown in the program list
export const isMainEventProgramVisible = (timeNow: Date): boolean => {
  const { mainEventProgramVisibleTime } = config.event();
  return (
    !mainEventProgramVisibleTime ||
    isSameOrAfter(timeNow, new Date(mainEventProgramVisibleTime))
  );
};

const getUpcomingLotterySignups = (
  lotterySignups: readonly LotterySignupWithProgramItem[],
  timeNow: Date,
): readonly LotterySignupWithProgramItem[] => {
  const upcomingLotterySignups = lotterySignups.filter((lotterySignup) => {
    return isAfter(
      addHours(new Date(getProgramItemStartTime(lotterySignup.programItem)), 1),
      timeNow,
    );
  });

  return upcomingLotterySignups;
};

const getGroupCreator = (
  groupMembers: readonly GroupMemberWithLotteryProgramItem[],
): GroupMemberWithLotteryProgramItem | null => {
  const groupCreator = groupMembers.find((member) => member.isGroupCreator);
  if (!groupCreator) {
    return null;
  }
  return groupCreator;
};

interface GetLotterySignupsParams {
  lotterySignups: readonly LotterySignupWithProgramItem[];
  isGroupCreator: boolean;
  groupMembers: readonly GroupMemberWithLotteryProgramItem[];
  isInGroup: boolean;
  showAllProgramItems: boolean;
  timeNow: Date;
}

export const getLotterySignups = ({
  lotterySignups,
  isGroupCreator,
  groupMembers,
  isInGroup,
  showAllProgramItems,
  timeNow,
}: GetLotterySignupsParams): readonly LotterySignupWithProgramItem[] => {
  // Show own lottery sign-ups if group creator or not in group
  if (isGroupCreator || !isInGroup) {
    return showAllProgramItems
      ? lotterySignups
      : getUpcomingLotterySignups(lotterySignups, timeNow);
  }

  // Show group creator lottery sign-ups if in group and not group creator
  const groupCreator = getGroupCreator(groupMembers);
  if (!groupCreator) {
    return [];
  }

  return showAllProgramItems
    ? groupCreator.lotterySignups
    : getUpcomingLotterySignups(groupCreator.lotterySignups, timeNow);
};

export const getUpcomingDirectSignups = (
  directSignups: readonly DirectSignupWithProgramItem[],
  timeNow: Date,
): readonly DirectSignupWithProgramItem[] => {
  const upcomingProgramItems = directSignups.filter((directSignup) =>
    isAfter(addHours(new Date(directSignup.programItem.startTime), 1), timeNow),
  );

  return upcomingProgramItems;
};

export const getUpcomingFavorites = (
  favoriteProgramItems: readonly ProgramItem[],
  timeNow: Date,
): readonly ProgramItem[] => {
  const upcomingProgramItems = favoriteProgramItems.filter(
    (favoriteProgramItem) => {
      return isAfter(
        addHours(new Date(getProgramItemStartTime(favoriteProgramItem)), 1),
        timeNow,
      );
    },
  );

  return upcomingProgramItems;
};
