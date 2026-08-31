import { groupBy, sample } from "remeda";
import { config } from "shared/config";
import { ProgramItem, SignupType } from "shared/types/models/programItem";
import { LotterySignup, User } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { tooEarlyForLotterySignup } from "shared/utils/tooEarlyForLotterySignup";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUsers } from "server/features/user/userRepository";
import { getLotteryRunTime } from "server/test/test-data-generation/lotteryRunTime";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

// How many of the event's lotteries the generated attendees enter. Keeps the seeded data to a
// readable size instead of every attendee holding sign-ups across the whole event.
const LOTTERIED_TIMES_COUNT = 4;

export const createLotterySignups = async (): Promise<void> => {
  const programItems = unsafelyUnwrap(await findProgramItems());
  const allUsers = unsafelyUnwrap(await findUsers());

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  logger.info(`Signup: ${programItems.length} program items`);
  logger.info(`Signup: ${users.length} users`);

  const groupedUsers = groupBy(users, (user) => user.groupCode);

  for (const [groupCode, groupMembers] of Object.entries(groupedUsers)) {
    // Individual users
    if (groupCode === "0") {
      logger.info("SIGNUP INDIVIDUAL USERS");
      await lotterySignupMultiple(programItems, groupMembers);
    }
    // Users in groups
    else {
      logger.info(`SIGNUP GROUP ${groupCode}`);
      await lotterySignupGroup(programItems, groupMembers);
    }
  }

  await updateProgramItemPopularity();
};

const getRandomLotterySignup = (
  programItems: readonly ProgramItem[],
): LotterySignup[] => {
  const { noKonstiSignupIds } = config.event();

  const activeProgramItems = programItems
    .filter((programItem) => programItem.signupType === SignupType.KONSTI)
    .filter((programItem) => isLotterySignupProgramItem(programItem))
    // The slots at the start of the event have no room for a lottery sign-up window, so the
    // predicate answers this rather than the generated start times being counted off
    .filter((programItem) => !tooEarlyForLotterySignup(programItem))
    .filter(
      (programItem) => !noKonstiSignupIds.includes(programItem.programItemId),
    );

  const uniqueTimes = [
    ...new Set(activeProgramItems.map(getLotteryRunTime)),
  ].slice(0, LOTTERIED_TIMES_COUNT);

  // Select random program items for each lottery
  return uniqueTimes.flatMap((lotteryRunTime) => {
    logger.debug(`Generate lottery signups for time ${lotteryRunTime}`);
    const programItemsForTime = activeProgramItems.filter(
      (activeProgramItem) =>
        getLotteryRunTime(activeProgramItem) === lotteryRunTime,
    );

    const numberOfSignups = Math.min(programItemsForTime.length, 3);
    const randomProgramItems = sample(programItemsForTime, numberOfSignups);

    return randomProgramItems.map((programItem, index) => ({
      programItemId: programItem.programItemId,
      priority: index + 1,
      signedToStartTime: programItem.startTime,
    }));
  });
};

const doLotterySignup = async (
  programItems: readonly ProgramItem[],
  user: User,
): Promise<User> => {
  const lotterySignups = getRandomLotterySignup(programItems);

  const updatedUser = unsafelyUnwrap(
    await saveLotterySignups({
      username: user.username,
      lotterySignups,
    }),
  );

  return updatedUser;
};

const lotterySignupMultiple = async (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): Promise<void> => {
  const promises: Promise<User>[] = [];

  for (const user of users) {
    if (user.username !== "admin" && user.username !== "helper") {
      promises.push(doLotterySignup(programItems, user));
    }
  }

  await Promise.all(promises);
};

const lotterySignupGroup = async (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): Promise<void> => {
  // Generate random sign-up data for the group creator
  const groupCreator = users.find((user) => user.isGroupCreator);
  if (!groupCreator) {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Error getting group creator");
  }

  const signupData = {
    username: groupCreator.username,
    lotterySignups: getRandomLotterySignup(programItems),
  };

  await saveLotterySignups(signupData);
};
