import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { hashPassword } from "server/utils/bcrypt";
import { UserGroup } from "shared/types/models/user";
import { saveUser } from "server/features/user/userRepository";
import { NewUser } from "server/types/userTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { generateGroupCode } from "server/features/user/group/groupService";

const SERIAL_MAX = 10000000;

export const createAdminUser = async (password?: string): Promise<void> => {
  logger.info('Generate data for admin user "admin:test"');

  const passwordHash = unsafelyUnwrap(await hashPassword(password ?? "test"));

  const registrationData: NewUser = {
    kompassiId: 0,
    username: "admin",
    passwordHash,
    userGroup: UserGroup.ADMIN,
    serial: faker.number.int(10000000).toString(),
    email: "admin@example.local",
    emailNotificationPermitAsked: true,
  };

  await saveUser(registrationData);
};

export const createHelpUser = async (password?: string): Promise<void> => {
  logger.info('Generate data for help user "helper:test"');

  const passwordHash = unsafelyUnwrap(await hashPassword(password ?? "test"));

  const registrationData: NewUser = {
    kompassiId: 0,
    username: "helper",
    passwordHash,
    userGroup: UserGroup.HELPER,
    serial: faker.number.int(10000000).toString(),
    email: "helper@example.local",
    emailNotificationPermitAsked: true,
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

  const passwordHash = unsafelyUnwrap(await hashPassword("test"));

  const registrationData: NewUser = {
    kompassiId: 0,
    username: `test${userNumber}`,
    passwordHash,
    userGroup: UserGroup.USER,
    serial: faker.number.int(10000000).toString(),
    email: `test${userNumber}@example.local`,
    emailNotificationPermitAsked: true,
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
  isGroupCreator: boolean;
  testUsers?: boolean;
  userNumber?: number;
}

const createUser = async ({
  groupCode,
  isGroupCreator,
  testUsers = false,
  userNumber = 0,
}: CreateUserParams): Promise<void> => {
  const passwordHash = testUsers
    ? unsafelyUnwrap(await hashPassword("test"))
    : "testPass"; // Skip hashing to save time

  const username = testUsers ? `group${userNumber}` : faker.internet.username();
  const registrationData: NewUser = {
    kompassiId: 0,
    username,
    passwordHash,
    userGroup: UserGroup.USER,
    serial: faker.number.int(SERIAL_MAX).toString(),
    groupCode,
    isGroupCreator,
    email: `${username}@example.local`,
    emailNotificationPermitAsked: true,
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

  const promises: Promise<void>[] = [];
  for (
    let groupMemberCount = 0;
    groupMemberCount < groupSize;
    groupMemberCount++
  ) {
    promises.push(
      createUser({
        groupCode,
        isGroupCreator: groupMemberCount === 0,
        testUsers,
        userNumber: groupMemberCount + 1,
      }),
    );
  }

  await Promise.all(promises);
};

export const createIndividualUsers = async (count: number): Promise<void> => {
  logger.info(`Generate data for ${count} users`);

  const promises: Promise<void>[] = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      createUser({
        groupCode: "0",
        isGroupCreator: false,
      }),
    );
  }

  await Promise.all(promises);
};
