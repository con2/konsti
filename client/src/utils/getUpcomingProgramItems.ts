import dayjs from "dayjs";
import { ProgramItem } from "shared/types/models/programItem";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDirectSignupEndTime } from "shared/utils/signupTimes";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";
import { GroupMemberWithLotteryProgramItem } from "client/views/group/groupSlice";
import { config } from "shared/config";

export const getUpcomingProgramItems = (
  programItems: readonly ProgramItem[],
): readonly ProgramItem[] => {
  const timeNow = getTimeNow();

  const upcomingProgramItems = programItems.filter((programItem) => {
    const directSignupEndTime = getDirectSignupEndTime(programItem);
    return directSignupEndTime.isSameOrAfter(timeNow);
  });

  return upcomingProgramItems;
};

const getUpcomingLotterySignups = (
  lotterySignups: readonly LotterySignupWithProgramItem[],
): readonly LotterySignupWithProgramItem[] => {
  const timeNow = getTimeNow();

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
  const groupCreator = groupMembers.find(
    (member) => member.groupCreatorCode === member.groupCode,
  );
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
}

export const getLotterySignups = ({
  lotterySignups,
  isGroupCreator,
  groupMembers,
  isInGroup,
  showAllProgramItems,
}: GetLotterySignupsParams): readonly LotterySignupWithProgramItem[] => {
  // Show own lottery signups if group creator or not in group
  if (isGroupCreator || !isInGroup) {
    return showAllProgramItems
      ? lotterySignups
      : getUpcomingLotterySignups(lotterySignups);
  }

  // Show group creator lottery signups if in group and not group creator
  const groupCreator = getGroupCreator(groupMembers);
  if (!groupCreator) {
    return [];
  }

  return showAllProgramItems
    ? groupCreator.lotterySignups
    : getUpcomingLotterySignups(groupCreator.lotterySignups);
};

export const getUpcomingDirectSignups = (
  directSignups: readonly DirectSignupWithProgramItem[],
): readonly DirectSignupWithProgramItem[] => {
  const timeNow = getTimeNow();

  const upcomingProgramItems = directSignups.filter((directSignup) =>
    dayjs(directSignup.programItem.startTime).add(1, "hours").isAfter(timeNow),
  );

  return upcomingProgramItems;
};

export const getUpcomingFavorites = (
  favoriteProgramItems: readonly ProgramItem[],
): readonly ProgramItem[] => {
  const timeNow = getTimeNow();

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
