import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { getDirectSignupEndTime } from "shared/utils/signupTimes";
import { GroupMemberWithLotteryProgramItem } from "client/views/group/groupSlice";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";

export const getUpcomingProgramItems = (
  programItems: readonly ProgramItem[],
  timeNow: Dayjs,
): readonly ProgramItem[] => {
  const upcomingProgramItems = programItems.filter((programItem) => {
    const directSignupEndTime = getDirectSignupEndTime(programItem);
    return directSignupEndTime.isSameOrAfter(timeNow);
  });

  return upcomingProgramItems;
};

// Before this time only pre-convention week program is shown in the program list
export const isMainEventProgramVisible = (timeNow: Dayjs): boolean => {
  const { mainEventProgramVisibleTime } = config.event();
  return (
    !mainEventProgramVisibleTime ||
    timeNow.isSameOrAfter(dayjs(mainEventProgramVisibleTime))
  );
};

const getUpcomingLotterySignups = (
  lotterySignups: readonly LotterySignupWithProgramItem[],
  timeNow: Dayjs,
): readonly LotterySignupWithProgramItem[] => {
  const { startTimesByParentIds } = config.event();

  const upcomingLotterySignups = lotterySignups.filter((lotterySignup) => {
    const parentStartTime = startTimesByParentIds.get(
      lotterySignup.programItem.parentId,
    );

    return dayjs(parentStartTime ?? lotterySignup.programItem.startTime)
      .add(1, "hours")
      .isAfter(timeNow);
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
  timeNow: Dayjs;
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
  timeNow: Dayjs,
): readonly DirectSignupWithProgramItem[] => {
  const upcomingProgramItems = directSignups.filter((directSignup) =>
    dayjs(directSignup.programItem.startTime).add(1, "hours").isAfter(timeNow),
  );

  return upcomingProgramItems;
};

export const getUpcomingFavorites = (
  favoriteProgramItems: readonly ProgramItem[],
  timeNow: Dayjs,
): readonly ProgramItem[] => {
  const { startTimesByParentIds } = config.event();

  const upcomingProgramItems = favoriteProgramItems.filter(
    (favoriteProgramItem) => {
      const parentStartTime = startTimesByParentIds.get(
        favoriteProgramItem.parentId,
      );

      return dayjs(parentStartTime ?? favoriteProgramItem.startTime)
        .add(1, "hours")
        .isAfter(timeNow);
    },
  );

  return upcomingProgramItems;
};
