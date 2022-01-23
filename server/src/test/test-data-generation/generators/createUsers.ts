import faker from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { hashPassword } from "server/utils/bcrypt";
import { UserGroup } from "shared/typings/models/user";
import { saveUser } from "server/features/user/userRepository";

const SERIAL_MAX = 10000000;

export const createAdminUser = async (password?: string): Promise<void> => {
  logger.info(`Generate data for admin user "admin:test"`);

  const passwordHash = await hashPassword(password ?? "test");

  const registrationData = {
    username: "admin",
    passwordHash: passwordHash,
    userGroup: UserGroup.ADMIN,
    serial: faker.datatype.number(10000000).toString(),
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  await saveUser(registrationData);
};

export const createHelpUser = async (): Promise<void> => {
  logger.info(`Generate data for help user "ropetiski:test"`);

  const registrationData = {
    username: "ropetiski",
    passwordHash: await hashPassword("test"),
    userGroup: UserGroup.HELP,
    serial: faker.datatype.number(10000000).toString(),
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  await saveUser(registrationData);
};

const createTestUser = async (userNumber: number): Promise<void> => {
  logger.info(`Generate data for user "test${userNumber}:test"`);

  const registrationData = {
    username: `test${userNumber}`,
    passwordHash: await hashPassword("test"),
    userGroup: UserGroup.USER,
    serial: faker.datatype.number(10000000).toString(),
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  await saveUser(registrationData);
};

export const createTestUsers = async (number: number): Promise<void> => {
  for (let i = 0; i < number; i += 1) {
    await createTestUser(i + 1);
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
    passwordHash: "testPass", // Skip hashing to save time
    userGroup: UserGroup.USER,
    serial:
      groupMemberCount === 0
        ? groupCode
        : faker.datatype.number(SERIAL_MAX).toString(),
    groupCode,
    favoritedGames: [],
    signedGames: [],
    enteredGames: [],
  };

  await saveUser(registrationData);
};

export const createUsersInGroup = async (count: number): Promise<void> => {
  const groupCode = faker.datatype.number(SERIAL_MAX).toString();

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
        groupCode: "0",
        groupMemberCount: -1,
      })
    );
  }

  await Promise.all(promises);
};
