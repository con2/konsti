import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { hashPassword } from "server/utils/bcrypt";
import { UserGroup } from "shared/types/models/user";
import { saveUser } from "server/features/user/userRepository";
import { NewUser } from "server/types/userTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { generateGroupCode } from "server/features/user/group/groupService";

// Match the length of real registration codes from the serial generator
const SERIAL_LENGTH = 10;

// Speed up test data generation by using same "test" password hash
let testPasswordHashPromise: ReturnType<typeof hashPassword> | undefined;

const getTestPasswordHash = async (): Promise<string> => {
  testPasswordHashPromise ??= hashPassword("test");
  return unsafelyUnwrap(await testPasswordHashPromise);
};

export const createAdminUser = async (password?: string): Promise<void> => {
  logger.info('Generate data for admin user "admin:test"');

  const passwordHash =
    password === undefined
      ? await getTestPasswordHash()
      : unsafelyUnwrap(await hashPassword(password));

  const registrationData: NewUser = {
    kompassiId: 0,
    username: "admin",
    passwordHash,
    userGroup: UserGroup.ADMIN,
    serial: faker.string.numeric(SERIAL_LENGTH),
    email: "admin@example.local",
    emailNotificationPermitAsked: true,
  };

  await saveUser(registrationData);
};

export const createHelpUser = async (password?: string): Promise<void> => {
  logger.info('Generate data for help user "helper:test"');

  const passwordHash =
    password === undefined
      ? await getTestPasswordHash()
      : unsafelyUnwrap(await hashPassword(password));

  const registrationData: NewUser = {
    kompassiId: 0,
    username: "helper",
    passwordHash,
    userGroup: UserGroup.HELPER,
    serial: faker.string.numeric(SERIAL_LENGTH),
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

  const passwordHash = await getTestPasswordHash();

  const registrationData: NewUser = {
    kompassiId: 0,
    username: `test${userNumber}`,
    passwordHash,
    userGroup: UserGroup.USER,
    serial: faker.string.numeric(SERIAL_LENGTH),
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
  const passwordHash = testUsers ? await getTestPasswordHash() : "testPass"; // Skip hashing to save time

  const username = testUsers ? `group${userNumber}` : faker.internet.username();
  const registrationData: NewUser = {
    kompassiId: 0,
    username,
    passwordHash,
    userGroup: UserGroup.USER,
    serial: faker.string.numeric(SERIAL_LENGTH),
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
