import dayjs from "dayjs";
import { GroupMember } from "shared/types/models/groups";
import { Game } from "shared/types/models/game";
import { getTimeNow } from "client/utils/getTimeNow";
import { Signup } from "shared/types/models/user";

export const getUpcomingGames = (
  games: readonly Game[],
  offsetByHours = 0,
): readonly Game[] => {
  const timeNow = getTimeNow();

  const upcomingGames = games.filter((game) =>
    dayjs(game.startTime).add(offsetByHours, "hours").isSameOrAfter(timeNow),
  );

  return upcomingGames;
};

const getUpcomingLotterySignups = (
  lotterySignups: readonly Signup[],
): readonly Signup[] => {
  const timeNow = getTimeNow();

  const upcomingLotterySignups = lotterySignups.filter((lotterySignup) => {
    return dayjs(lotterySignup.gameDetails.startTime)
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
  getAllGames: boolean;
}

export const getLotterySignups = ({
  lotterySignups,
  isGroupCreator,
  groupMembers,
  isInGroup,
  getAllGames,
}: GetLotterySignupsParams): readonly Signup[] => {
  if (isGroupCreator || !isInGroup) {
    return getAllGames
      ? lotterySignups
      : getUpcomingLotterySignups(lotterySignups);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!isGroupCreator) {
    const groupCreator = getGroupCreator(groupMembers);
    if (!groupCreator) {
      return [];
    }

    return getAllGames
      ? groupCreator.lotterySignups
      : getUpcomingLotterySignups(groupCreator.lotterySignups);
  }

  return lotterySignups;
};

export const getUpcomingDirectSignups = (
  directSignups: readonly Signup[],
): readonly Signup[] => {
  const timeNow = getTimeNow();

  const upcomingGames = directSignups.filter((directSignup) =>
    dayjs(directSignup.gameDetails.startTime).add(1, "hours").isAfter(timeNow),
  );

  return upcomingGames;
};

export const getUpcomingFavorites = (
  favoritedGames: readonly Game[],
): readonly Game[] => {
  const timeNow = getTimeNow();

  const upcomingGames = favoritedGames.filter((favoritedGame) =>
    dayjs(favoritedGame.startTime).add(1, "hours").isAfter(timeNow),
  );

  return upcomingGames;
};
