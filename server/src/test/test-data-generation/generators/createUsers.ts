import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { hashPassword } from "server/utils/bcrypt";
import { UserGroup } from "shared/typings/models/user";
import { saveUser } from "server/features/user/userRepository";
import { NewUser } from "server/typings/user.typings";

const SERIAL_MAX = 10000000;

export const createAdminUser = async (password?: string): Promise<void> => {
  logger.info(`Generate data for admin user "admin:test"`);

  const passwordHash = await hashPassword(password ?? "test");

  const registrationData: NewUser = {
    username: "admin",
    passwordHash: passwordHash,
    userGroup: UserGroup.ADMIN,
    serial: faker.datatype.number(10000000).toString(),
  };

  await saveUser(registrationData);
};

export const createHelpUser = async (): Promise<void> => {
  logger.info(`Generate data for help user "ropetiski:test"`);

  const registrationData: NewUser = {
    username: "ropetiski",
    passwordHash: await hashPassword("test"),
    userGroup: UserGroup.HELP,
    serial: faker.datatype.number(10000000).toString(),
  };

  await saveUser(registrationData);
};

interface CreateTestUserParams {
  userNumber: number;
}

const createTestUser = async ({
  userNumber,
}: CreateTestUserParams): Promise<void> => {
  logger.info(`Generate data for user "test${userNumber}:test"`);

  const registrationData: NewUser = {
    username: `test${userNumber}`,
    passwordHash: await hashPassword("test"),
    userGroup: UserGroup.USER,
    serial: faker.datatype.number(10000000).toString(),
  };

  await saveUser(registrationData);
};

interface CreateTestUsersParams {
  userCount: number;
  inSameGroup?: boolean;
}

export const createTestUsers = async ({
  userCount,
  inSameGroup = false,
}: CreateTestUsersParams): Promise<void> => {
  for (let i = 0; i < userCount; i += 1) {
    await createTestUser({ userNumber: i + 1 });
  }
};

interface CreateUserParams {
  groupCode: string;
  groupMemberCount: number;
  testUsers?: boolean;
  userNumber?: number;
}

const createUser = async ({
  groupCode,
  groupMemberCount,
  testUsers = false,
  userNumber = 0,
}: CreateUserParams): Promise<void> => {
  const registrationData: NewUser = {
    username: testUsers ? `group${userNumber}` : faker.internet.userName(),
    passwordHash: testUsers ? await hashPassword("test") : "testPass", // Skip hashing to save time
    userGroup: UserGroup.USER,
    serial:
      groupMemberCount === 0
        ? groupCode
        : faker.datatype.number(SERIAL_MAX).toString(),
    groupCode,
  };

  await saveUser(registrationData);
};

interface CreateUsersInGroupParams {
  groupSize: number;
  testUsers: boolean;
}

export const createUsersInGroup = async ({
  groupSize,
  testUsers,
}: CreateUsersInGroupParams): Promise<void> => {
  const groupCode = faker.datatype.number(SERIAL_MAX).toString();

  logger.info(`Generate data for ${groupSize} users in group ${groupCode}`);

  const promises: Array<Promise<void>> = [];
  for (
    let groupMemberCount = 0;
    groupMemberCount < groupSize;
    groupMemberCount++
  ) {
    promises.push(
      createUser({
        groupCode,
        groupMemberCount,
        testUsers,
        userNumber: groupMemberCount + 1,
      })
    );
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
