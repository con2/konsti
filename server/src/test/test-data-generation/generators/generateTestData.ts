import faker from 'faker';
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
  await createAdminUser();
  await createHelpUser();

  if (testUsersCount) await createTestUsers(testUsersCount);
  if (newUsersCount) await createIndividualUsers(newUsersCount);

  for (let i = 0; i < numberOfGroups; i++) {
    const randomGroupCode = faker.datatype.number().toString();
    await createUsersInGroup(groupSize, randomGroupCode);
  }

  await createGames(newGamesCount, signupTimes);

  await createSignups();
};
