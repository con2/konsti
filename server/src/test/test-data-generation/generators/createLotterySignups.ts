import dayjs from "dayjs";
import { groupBy, sample } from "remeda";
import { logger } from "server/utils/logger";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { ProgramItem, SignupType } from "shared/types/models/programItem";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { LotterySignup, User } from "shared/types/models/user";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";

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
    .filter(
      (programItem) => !noKonstiSignupIds.includes(programItem.programItemId),
    );

  const startTimes = activeProgramItems.map((activeProgramItem) =>
    dayjs(activeProgramItem.startTime).toISOString(),
  );
  const uniqueTimes = [...new Set(startTimes)];
  // Three first times are direct signup only
  const firstFourTimes = uniqueTimes.slice(3, 7);

  // Select random program items for each start time
  return firstFourTimes.flatMap((startTime) => {
    logger.debug(`Generate lottery signups for time ${startTime}`);
    const programItemsForTime = activeProgramItems.filter(
      (activeProgramItem) =>
        dayjs(activeProgramItem.startTime).toISOString() ===
        dayjs(startTime).toISOString(),
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
  // Generate random signup data for the group creator
  const groupCreator = users.find(
    (user) => user.groupCreatorCode === user.groupCode,
  );
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
