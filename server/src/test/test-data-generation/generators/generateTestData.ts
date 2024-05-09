import {
  createIndividualUsers,
  createTestUsers,
  createUsersInGroup,
} from "server/test/test-data-generation/generators/createUsers";
import { createProgramItems } from "server/test/test-data-generation/generators/createProgramItems";
import { createLotterySignups } from "server/test/test-data-generation/generators/createLotterySignups";

export const generateTestData = async (
  newUsersCount: number,
  newGamesCount: number,
  groupSize: number,
  numberOfGroups: number,
  testUsersCount: number,
): Promise<void> => {
  await generateTestUsers(
    newUsersCount,
    groupSize,
    numberOfGroups,
    testUsersCount,
  );

  await createProgramItems(newGamesCount);

  await createLotterySignups();
};

export const generateTestUsers = async (
  newUsersCount: number,
  groupSize: number,
  numberOfGroups: number,
  testUsersCount: number,
): Promise<void> => {
  if (testUsersCount) {
    await createTestUsers({ userCount: testUsersCount });
  }
  if (newUsersCount) {
    await createIndividualUsers(newUsersCount);
  }

  for (let i = 0; i < numberOfGroups; i++) {
    if (i === 0) {
      await createUsersInGroup({ groupSize, testUsers: true });
    }
    await createUsersInGroup({ groupSize, testUsers: false });
  }
};
