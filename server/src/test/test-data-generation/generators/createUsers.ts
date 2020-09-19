import faker from 'faker';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { hashPassword } from 'utils/bcrypt';
import { UserGroup } from 'typings/user.typings';
export const createAdminUser = async (): Promise<void> => {
  logger.info(`Generate data for admin user "admin:test"`);

  const passwordHash = await hashPassword('test');

  const registrationData = {
    username: 'admin',
    passwordHash: passwordHash,
    userGroup: UserGroup.admin,
    serial: faker.random.number(10000000).toString(),
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  try {
    await db.user.saveUser(registrationData);
  } catch (error) {
    logger.error(error);
  }
};

export const createHelpUser = async (): Promise<void> => {
  logger.info(`Generate data for help user "ropetiski:test"`);

  const registrationData = {
    username: 'ropetiski',
    passwordHash: await hashPassword('test'),
    userGroup: UserGroup.help,
    serial: faker.random.number(10000000).toString(),
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  try {
    await db.user.saveUser(registrationData);
  } catch (error) {
    logger.error(error);
  }
};

const createTestUser = async (userNumber: number): Promise<void> => {
  logger.info(`Generate data for user "test${userNumber}:test"`);

  const registrationData = {
    username: `test${userNumber}`,
    passwordHash: await hashPassword('test'),
    userGroup: UserGroup.user,
    serial: faker.random.number(10000000).toString(),
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  try {
    await db.user.saveUser(registrationData);
  } catch (error) {
    logger.error(error);
  }
};

export const createTestUsers = async (number: number): Promise<void> => {
  for (let i = 0; i < number; i += 1) {
    try {
      await createTestUser(i + 1);
    } catch (error) {
      logger.error(error);
    }
  }
};

const createUser = async ({
  groupCode,
  groupMemberCount,
}: {
  groupCode: string;
  groupMemberCount: number;
}): Promise<void> => {
  const registrationData = {
    username: faker.internet.userName(),
    passwordHash: 'testPass', // Skip hashing to save time
    userGroup: UserGroup.user,
    serial:
      groupMemberCount === 0 ? groupCode : faker.random.number().toString(),
    groupCode,
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  try {
    await db.user.saveUser(registrationData);
  } catch (error) {
    logger.error(error);
  }
};

export const createUsersInGroup = async (
  count: number,
  groupCode: string
): Promise<void> => {
  logger.info(`Generate data for ${count} users in group ${groupCode}`);

  const promises: Array<Promise<void>> = [];
  for (let groupMemberCount = 0; groupMemberCount < count; groupMemberCount++) {
    promises.push(createUser({ groupCode, groupMemberCount }));
  }

  await Promise.all(promises);
};

export const createIndividualUsers = async (count: number): Promise<void> => {
  logger.info(`Generate data for ${count} users`);

  const promises: Array<Promise<void>> = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      createUser({
        groupCode: '0',
        groupMemberCount: -1,
      })
    );
  }

  await Promise.all(promises);
};
