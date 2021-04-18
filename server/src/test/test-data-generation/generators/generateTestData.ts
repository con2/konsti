import {
  createIndividualUsers,
  createAdminUser,
  createTestUsers,
  createUsersInGroup,
  createHelpUser,
} from 'server/test/test-data-generation/generators/createUsers';
import { createGames } from 'server/test/test-data-generation/generators/createGames';
import { createSignups } from 'server/test/test-data-generation/generators/createSignups';

export const generateTestData = async (
  newUsersCount: number,
  newGamesCount: number,
  groupSize: number,
  numberOfGroups: number,
  testUsersCount: number,
  signupTimes: number
): Promise<void> => {
  await generateTestUsers(
    newUsersCount,
    groupSize,
    numberOfGroups,
    testUsersCount
  );

  await createGames(newGamesCount, signupTimes);

  await createSignups();
};

export const generateTestUsers = async (
  newUsersCount: number,
  groupSize: number,
  numberOfGroups: number,
  testUsersCount: number
): Promise<void> => {
  await createAdminUser();
  await createHelpUser();

  if (testUsersCount) await createTestUsers(testUsersCount);
  if (newUsersCount) await createIndividualUsers(newUsersCount);

  for (let i = 0; i < numberOfGroups; i++) {
    await createUsersInGroup(groupSize);
  }
};
