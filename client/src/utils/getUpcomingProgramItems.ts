import dayjs from "dayjs";
import { GroupMember } from "shared/types/models/groups";
import { ProgramItem } from "shared/types/models/programItem";
import { getTimeNow } from "client/utils/getTimeNow";
import { Signup } from "shared/types/models/user";
import { getDirectSignupEndTime } from "shared/utils/signupTimes";

export const getUpcomingProgramItems = (
  programItems: readonly ProgramItem[],
): readonly ProgramItem[] => {
  const timeNow = getTimeNow();

  const upcomingProgramItems = programItems.filter((programItem) => {
    const directSignupEndTime = getDirectSignupEndTime(programItem);
    return dayjs(directSignupEndTime).isSameOrAfter(timeNow);
  });

  return upcomingProgramItems;
};

const getUpcomingLotterySignups = (
  lotterySignups: readonly Signup[],
): readonly Signup[] => {
  const timeNow = getTimeNow();

  const upcomingLotterySignups = lotterySignups.filter((lotterySignup) => {
    return dayjs(lotterySignup.programItem.startTime)
      .add(1, "hours")
      .isAfter(timeNow);
  });

  return upcomingLotterySignups;
};

const getGroupCreator = (
  groupMembers: readonly GroupMember[],
): GroupMember | null => {
  const groupCreator = groupMembers.find(
    (member) => member.groupCreatorCode === member.groupCode,
  );
  if (!groupCreator) {
    return null;
  }
  return groupCreator;
};

interface GetLotterySignupsParams {
  lotterySignups: readonly Signup[];
  isGroupCreator: boolean;
  groupMembers: readonly GroupMember[];
  isInGroup: boolean;
  getAllProgramItems: boolean;
}

export const getLotterySignups = ({
  lotterySignups,
  isGroupCreator,
  groupMembers,
  isInGroup,
  getAllProgramItems,
}: GetLotterySignupsParams): readonly Signup[] => {
  if (isGroupCreator || !isInGroup) {
    return getAllProgramItems
      ? lotterySignups
      : getUpcomingLotterySignups(lotterySignups);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!isGroupCreator) {
    const groupCreator = getGroupCreator(groupMembers);
    if (!groupCreator) {
      return [];
    }

    return getAllProgramItems
      ? groupCreator.lotterySignups
      : getUpcomingLotterySignups(groupCreator.lotterySignups);
  }

  return lotterySignups;
};

export const getUpcomingDirectSignups = (
  directSignups: readonly Signup[],
): readonly Signup[] => {
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

  const upcomingProgramItems = favoriteProgramItems.filter(
    (favoriteProgramItem) =>
      dayjs(favoriteProgramItem.startTime).add(1, "hours").isAfter(timeNow),
  );

  return upcomingProgramItems;
};
