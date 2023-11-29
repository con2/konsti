import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { hashPassword } from "server/utils/bcrypt";
import { UserGroup } from "shared/typings/models/user";
import { saveUser } from "server/features/user/userRepository";
import { NewUser } from "server/types/userTypes";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { makeSuccessResult } from "shared/utils/result";
import { generateGroupCode } from "server/features/user/group/groupService";

const SERIAL_MAX = 10000000;

export const createAdminUser = async (password?: string): Promise<void> => {
  logger.info(`Generate data for admin user "admin:test"`);

  const passwordHashResult = await hashPassword(password ?? "test");
  const passwordHash = unsafelyUnwrapResult(passwordHashResult);

  const registrationData: NewUser = {
    kompassiId: 0,
    username: "admin",
    passwordHash,
    userGroup: UserGroup.ADMIN,
    serial: faker.number.int(10000000).toString(),
  };

  await saveUser(registrationData);
};

export const createHelpUser = async (password?: string): Promise<void> => {
  logger.info(`Generate data for help user "helper:test"`);

  const passwordHashResult = await hashPassword(password ?? "test");
  const passwordHash = unsafelyUnwrapResult(passwordHashResult);

  const registrationData: NewUser = {
    kompassiId: 0,
    username: "helper",
    passwordHash,
    userGroup: UserGroup.HELP,
    serial: faker.number.int(10000000).toString(),
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

  const passwordHashResult = await hashPassword("test");
  const passwordHash = unsafelyUnwrapResult(passwordHashResult);

  const registrationData: NewUser = {
    kompassiId: 0,
    username: `test${userNumber}`,
    passwordHash,
    userGroup: UserGroup.USER,
    serial: faker.number.int(10000000).toString(),
  };

  await saveUser(registrationData);
};

interface CreateTestUsersParams {
  userCount: number;
  inSameGroup?: boolean;
}

export const createTestUsers = async ({
  userCount,
}: CreateTestUsersParams): Promise<void> => {
  for (let i = 0; i < userCount; i += 1) {
    await createTestUser({ userNumber: i + 1 });
  }
};

interface CreateUserParams {
  groupCode: string;
  groupCreatorCode: string;
  testUsers?: boolean;
  userNumber?: number;
}

const createUser = async ({
  groupCode,
  groupCreatorCode,
  testUsers = false,
  userNumber = 0,
}: CreateUserParams): Promise<void> => {
  const passwordHashResult = testUsers
    ? await hashPassword("test")
    : makeSuccessResult("testPass"); // Skip hashing to save time
  const passwordHash = unsafelyUnwrapResult(passwordHashResult);

  const registrationData: NewUser = {
    kompassiId: 0,
    username: testUsers ? `group${userNumber}` : faker.internet.userName(),
    passwordHash,
    userGroup: UserGroup.USER,
    serial: faker.number.int(SERIAL_MAX).toString(),
    groupCode,
    groupCreatorCode,
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
  const groupCode = generateGroupCode();

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
        groupCreatorCode: groupMemberCount === 0 ? groupCode : "0",
        testUsers,
        userNumber: groupMemberCount + 1,
      }),
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
        groupCreatorCode: "0",
      }),
    );
  }

  await Promise.all(promises);
};
